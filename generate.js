const fs = require('fs/promises');
const dns = require('dns').promises;

const sourceUrls = [
  "https://github.com/barry-far/V2ray-Config/raw/refs/heads/main/All_Configs_Sub.txt",
  "https://raw.githubusercontent.com/MustafaBaqer/VestraNet-Nodes/refs/heads/main/subscriptions/mix-normal.txt",
  "https://raw.githubusercontent.com/MohammadBahemmat/V2ray-Collector/refs/heads/main/all_servers.txt",
  "https://raw.githubusercontent.com/0xRadikal/Free-v2ray-Configs/refs/heads/main/all/configs.txt",
];

const FETCH_TIMEOUT_MS = 30_000;
const CONCURRENCY_LIMIT = 30;
const OUTPUT_FILE = 'sub.txt';

// دومينات كنستعملوها باش نستخرجو منها IPs (غالباً Cloudflare anycast)
const SNI_LIST = [
  "api.server.io",
  "canary-proxsee-cf.pscp.tv",
  "game01.circus.nl",
  "x.com",
  "www.getlucky.com",
];

// ---------- helpers ----------
function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function isPrintableText(text) {
  if (!text) return false;
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.length / text.length > 0.9;
}

function b64DecodeUtf8(b64) {
  try {
    b64 = b64.trim().replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
    b64 += '='.repeat((4 - (b64.length % 4)) % 4);
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch { return null; }
}

function decodeIfBase64(text) {
  if (!text) return text;
  const decoded = b64DecodeUtf8(text);
  if (!decoded || !isPrintableText(decoded)) return text;
  return decoded.includes('vless://') ? decoded : text;
}

async function fetchWithLimit(urls, limit) {
  const results = [];
  for (let i = 0; i < urls.length; i += limit) {
    const batch = urls.slice(i, i + limit);
    const batchResults = await Promise.allSettled(
      batch.map((url) =>
        fetch(url, {
          headers: { 'user-agent': 'Mozilla/5.0' },
          signal: timeoutSignal(FETCH_TIMEOUT_MS),
        })
          .then((res) => (res.ok ? res.text() : ''))
          .catch(() => '')
      )
    );
    results.push(...batchResults);
  }
  return results;
}

// ---------- IP pool ----------
async function buildIpPool(domains) {
  const ips = new Set();
  await Promise.allSettled(
    domains.map(async (d) => {
      try {
        const addrs = await dns.lookup(d, { family: 4, all: true });
        for (const a of addrs) if (a?.address) ips.add(a.address);
      } catch (_) {}
    })
  );
  return [...ips];
}

// نبدلو الـ host (IP/domain) بـ IP جديد، مع الحفاظ على UUID، port، query، fragment
function replaceAddressWithIp(uri, newIp) {
  // vless://uuid@host:port?...#...   =>   vless://uuid@NEWIP:port?...#...
  return uri.replace(
    /^(vless:\/\/[^@]+@)([^:\/?#]+)(:\d+)/,
    (_m, p1, _oldHost, p3) => `${p1}${newIp}${p3}`
  );
}

// ---------- VLESS Filter & Modifier ----------
function processVless(uri, ipPool) {
  try {
    if (!uri.startsWith('vless://')) return null;

    // 1. المنفذ خاصو يكون 443
    const portMatch = uri.match(/@[^:]+:(\d+)/);
    if (!portMatch || portMatch[1] !== '443') return null;

    // 2. النوع reality
    if (!uri.includes('security=reality')) return null;

    // 3. إذا ما عندناش IPs، نرجّعو الرابط كيفما هو
    if (!ipPool.length) return uri;

    // 4. كنختارو IP عشوائي ونبدلو بيه العنوان
    const randomIp = ipPool[Math.floor(Math.random() * ipPool.length)];
    return replaceAddressWithIp(uri, randomIp);
  } catch (_) {
    return null;
  }
}

// ---------- main ----------
async function main() {
  // نبنيو pool ديال IPs من الدومينات
  const ipPool = await buildIpPool(SNI_LIST);
  console.log(`ℹ️ Resolved ${ipPool.length} IP(s) from SNI_LIST`);
  if (!ipPool.length) {
    console.warn('⚠️ Could not resolve any IPs — addresses will stay unchanged.');
  }

  const results = await fetchWithLimit(sourceUrls, CONCURRENCY_LIMIT);
  const texts = results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);

  const filteredConfigs = [];
  const seenConfigs = new Set();

  for (let text of texts) {
    if (!text.includes('vless://')) {
      const decoded = decodeIfBase64(text);
      if (decoded && decoded.includes('vless://')) text = decoded;
    }

    const matches = text.match(/vless:\/\/[^\s"'<>]+/g) || [];

    for (const uri of matches) {
      // dedup على أساس UUID + pbk (قبل ما نبدلو IP)
      const uuid = (uri.match(/vless:\/\/([^@]+)@/) || [])[1] || uri;
      const pbk = (uri.match(/[?&]pbk=([^&]+)/) || [])[1] || '';
      const dedupKey = `${uuid}|${pbk}`;
      if (seenConfigs.has(dedupKey)) continue;

      const modifiedUri = processVless(uri, ipPool);
      if (modifiedUri) {
        seenConfigs.add(dedupKey);
        filteredConfigs.push(modifiedUri);
      }
    }
  }

  if (filteredConfigs.length === 0) {
    console.error('⚠️ No VLESS (443/reality) configs found in the provided sources.');
    try {
      const old = await fs.readFile(OUTPUT_FILE, 'utf8');
      if (old.trim().length > 0) {
        console.warn(`ℹ️ Keeping existing ${OUTPUT_FILE} to avoid wiping.`);
        process.exit(0);
      }
    } catch (_) {}

    await fs.writeFile(
      OUTPUT_FILE,
      '# No VLESS (443/reality) configs found at the moment.\n',
      'utf8'
    );
    process.exit(0);
  }

  await fs.writeFile(OUTPUT_FILE, filteredConfigs.join('\n'), 'utf8');
  console.log(
    `✅ Saved ${filteredConfigs.length} VLESS (443/reality) configs with random IP (SNI untouched) to ${OUTPUT_FILE}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
