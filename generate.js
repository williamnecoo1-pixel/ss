const fs = require('fs/promises');

const sourceUrls = [
  "https://github.com/barry-far/V2ray-Config/raw/refs/heads/main/All_Configs_Sub.txt",
  "https://raw.githubusercontent.com/Maskkost93/kizyak-vpn-4.0/refs/heads/main/kizyakbeta6.txt",
  "https://raw.githubusercontent.com/nyeinkokoaung404/V2ray-Configs/main/Splitted-By-Protocol/ss.txt",
  "https://raw.githubusercontent.com/svinakraft-maker/FlareFeed/main/public/Top500.txt",
  "https://raw.githubusercontent.com/pctaha501-create/FreeVPN-Subscription-Mirror/main/output/v2ray-base64.txt",
  "https://raw.githubusercontent.com/asgharkapk/Sub-Config-Extractor/refs/heads/main/output_configs/mixed/vpnclashfa-backup/SubConfigShuffler/10ium_V2Hub_merged_cloudflare.txt.yaml",
  "https://raw.githubusercontent.com/asgharkapk/Sub-Config-Extractor/refs/heads/main/output_configs/ss/10ium/V2Hub3/merged_base64.yaml",
  "https://raw.githubusercontent.com/pie-with-jam/PulseProxy/main/githubmirror/15.txt",
  "https://raw.githubusercontent.com/MohammadBahemmat/V2ray-Collector/main/servers/vless_servers.txt",
  "https://raw.githubusercontent.com/Au1rxx/free-vpn-subscriptions/main/output/v2ray-base64.txt",
  "https://raw.githubusercontent.com/amir-reza-bijandi/v2ray-configs/main/configs.txt",
  "https://raw.githubusercontent.com/10Dream/sub-mod/main/sub/base64/split/countries/PL.txt"
  "https://raw.githubusercontent.com/alirzza9/ConfigsHUB-VLESS/HEAD/sub/vless-all.txt",
  "https://raw.githubusercontent.com/10Dream/sub-mod/main/sub/split/countries/TW.txt",
  "https://raw.githubusercontent.com/lorenzazy7kenyon/free-vpn-subscriptions/main/output/by-country/v2ray-base64-RO.txt",
  "https://raw.githubusercontent.com/hamedcode/port-based-v2ray-configs/main/detailed/vmess/80.txt",
  "https://raw.githubusercontent.com/morpheusadam/v2ray-config/main/subs/bundles/vmess.txt",
  "https://raw.githubusercontent.com/10Dream/sub-mod/main/sub/split/countries/IL.txt",
  "https://raw.githubusercontent.com/10Dream/sub-mod/main/sub/base64/split/countries/IL.txt",
  "https://raw.githubusercontent.com/pie-with-jam/5ubscrpt10n-Reborn/main/mini/m1n1-5ub-31.txt",
  "https://raw.githubusercontent.com/TheCrowCreature/v2rayExtractor/refs/heads/main/ss.html",
  "https://raw.githubusercontent.com/10Dream/sub-mod/main/sub/normal/kaveh_donations",
  "https://raw.githubusercontent.com/10ium/ScrapeAndCategorize/refs/heads/main/output_configs/Lithuania.txt",
  "https://raw.githubusercontent.com/drmikecrypto/PulseConfigs/HEAD/fast/configs.txt",
  "https://raw.githubusercontent.com/Maskkost93/kizyak-vpn-4.0/refs/heads/main/kizyakbeta6BL.txt",
  "https://raw.githubusercontent.com/yafeisun/v2raynode/refs/heads/main/result/karing.txt",
  "https://raw.githubusercontent.com/rango-cfs/NewCollector/refs/heads/main/v2ray_links.txt",
  "https://raw.githubusercontent.com/Agumuzi/crhopper/main/CR-Hopper.txt",
  "https://raw.githubusercontent.com/cyrusalbert/ArashOnline/refs/heads/main/lowest.txt",
];

const FETCH_TIMEOUT_MS = 30_000;
const CONCURRENCY_LIMIT = 30;
const OUTPUT_FILE = 'sub.txt';

// ✅ الثوابت الجديدة
const TARGET_IP = "104.18.37.127"; 
const ALLOWED_PORTS = new Set(['443']); 

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

// نبدلو العنوان (host أو IP) بـ IP جديد، مع الحفاظ على UUID، port، query، fragment
function replaceAddressWithIp(uri, newIp) {
  // هذا الـ Regex كيلقط الجزء ديال host/IP وكيبدلو
  return uri.replace(
    /^(vless:\/\/[^@]+@)([^:\/?#]+)(:\d+)/,
    (_m, p1, _oldHost, p3) => `${p1}${newIp}${p3}`
  );
}

// ---------- VLESS Filter & Modifier ----------
function processVless(uri) {
  try {
    if (!uri.startsWith('vless://')) return null;

    // 1. المنفذ خاصو يكون 443
    const portMatch = uri.match(/@[^:]+:(\d+)/);
    if (!portMatch || !ALLOWED_PORTS.has(portMatch[1])) return null;

    // 2. النوع خاصو يكون WS أو gRPC
    // الكود كيقلب على type=ws أو type=grpc أو network=ws أو network=grpc
    const isWsOrGrpc = 
      /[?&](?:type|network)=(ws|grpc)(?:&|#|$)/i.test(uri);

    if (!isWsOrGrpc) return null;

    // 3. الأمان TLS
    if (!/[?&]security=tls(?:&|#|$)/i.test(uri)) return null;

    // 4. نبدلو العنوان بـ TARGET_IP
    return replaceAddressWithIp(uri, TARGET_IP);
  } catch (_) {
    return null;
  }
}

// ---------- main ----------
async function main() {
  console.log(`ℹ️ Target IP will be forced to: ${TARGET_IP}`);
  console.log(`ℹ️ Collecting VLESS WS/gRPC TLS on port(s): ${[...ALLOWED_PORTS].join(', ')}`);

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
      // dedup على أساس UUID + port + path (قبل تبديل IP)
      const uuid = (uri.match(/vless:\/\/([^@]+)@/) || [])[1] || '';
      const port = (uri.match(/@[^:]+:(\d+)/) || [])[1] || '';
      const path = (uri.match(/[?&]path=([^&]+)/) || [])[1] || '';
      const serviceName = (uri.match(/[?&]serviceName=([^&]+)/) || [])[1] || ''; // لـ gRPC
      
      const dedupKey = `${uuid}|${port}|${path}|${serviceName}`;
      if (seenConfigs.has(dedupKey)) continue;

      const modifiedUri = processVless(uri);
      if (modifiedUri) {
        seenConfigs.add(dedupKey);
        filteredConfigs.push(modifiedUri);
      }
    }
  }

  if (filteredConfigs.length === 0) {
    console.error('⚠️ No VLESS (WS/gRPC, TLS, on port 443) configs found in the provided sources.');
    try {
      const old = await fs.readFile(OUTPUT_FILE, 'utf8');
      if (old.trim().length > 0) {
        console.warn(`ℹ️ Keeping existing ${OUTPUT_FILE} to avoid wiping.`);
        process.exit(0);
      }
    } catch (_) {}

    await fs.writeFile(
      OUTPUT_FILE,
      '# No VLESS (WS/gRPC, TLS, on port 443) configs found at the moment.\n',
      'utf8'
    );
    process.exit(0);
  }

  await fs.writeFile(OUTPUT_FILE, filteredConfigs.join('\n'), 'utf8');
  console.log(
    `✅ Saved ${filteredConfigs.length} VLESS WS/gRPC TLS configs with IP ${TARGET_IP} to ${OUTPUT_FILE}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
