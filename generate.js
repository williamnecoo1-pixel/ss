const fs = require('fs/promises');

const sourceUrls = [
  "https://raw.githubusercontent.com/MustafaBaqer/VestraNet-Nodes/refs/heads/main/subscriptions/mix-normal.txt",
  "https://raw.githubusercontent.com/MatinGhanbari/v2ray-configs/main/subscriptions/v2ray/subs/sub5.txt",
  "https://raw.githubusercontent.com/MatinGhanbari/v2ray-configs/main/subscriptions/base64/subs/sub5.txt",
  "https://raw.githubusercontent.com/MohammadBahemmat/V2ray-Collector/main/servers/tuic_servers.txt",
  "https://raw.githubusercontent.com/asgharkapk/Sub-Config-Extractor/refs/heads/main/output_configs/v2ray/10ium/base64-encoder/miladtahanian_config.yaml",
  "https://raw.githubusercontent.com/Argh94/V2RayAutoConfig/refs/heads/main/configs/Tuic.txt",
  "https://raw.githubusercontent.com/Delta-Kronecker/V2ray-Config/refs/heads/main/config/sni/protocols/trojan_sni.txt",
  "https://raw.githubusercontent.com/asgharkapk/Sub-Config-Extractor/refs/heads/main/output_configs/mixed/10ium/base64-encoder/encoded/10ium_mixed_iran.txt.yaml",
  "https://raw.githubusercontent.com/asgharkapk/Sub-Config-Extractor/refs/heads/main/output_configs/mixed/vpnclashfa-backup/MirrorMan/hamedp-71_Trojan_hp.b64.yaml",
  "https://raw.githubusercontent.com/pog7x/vpn-configs/refs/heads/master/githubmirror/17.txt",
  "https://raw.githubusercontent.com/Hidashimora/free-vpn-anti-rkn/main/configs/19.1.txt",
  "https://raw.githubusercontent.com/Argh94/V2RayAutoConfig/refs/heads/main/configs/Slovakia.txt",
  "https://raw.githubusercontent.com/asgharkapk/Sub-Config-Extractor/refs/heads/main/output_configs/mixed/Mosifree/_SS.yaml",
];

const FETCH_TIMEOUT_MS = 30_000;
const CONCURRENCY_LIMIT = 30;
const OUTPUT_FILE = 'sub.txt'; // حفظ ف الروت مباشرة

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
    b64 = b64.trim()
      .replace(/\s/g, '')
      .replace(/-/g, '+') // دعم URL-safe base64
      .replace(/_/g, '/');
    b64 += '='.repeat((4 - (b64.length % 4)) % 4);
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

function decodeIfBase64(text) {
  if (!text) return text;
  const decoded = b64DecodeUtf8(text);
  if (!decoded || !isPrintableText(decoded)) return text;
  return decoded.includes('ss://') ? decoded : text;
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
          .then((res) => {
            if (!res.ok) {
              console.warn(`[FAIL ${res.status}] ${url}`);
              return '';
            }
            return res.text();
          })
          .catch((err) => {
            console.warn(`[ERR] ${url} — ${err?.message ?? String(err)}`);
            return '';
          })
      )
    );
    results.push(...batchResults);
  }
  return results;
}

// ---------- SS parsing ----------
function parseUserinfo(userinfo) {
  if (!userinfo) return null;
  if (userinfo.includes(':')) {
    const idx = userinfo.indexOf(':');
    const method = userinfo.slice(0, idx);
    const password = userinfo.slice(idx + 1);
    return method ? { method, password } : null;
  }
  const decoded = b64DecodeUtf8(userinfo);
  if (!decoded || !decoded.includes(':')) return null;
  const idx = decoded.indexOf(':');
  const method = decoded.slice(0, idx);
  const password = decoded.slice(idx + 1);
  return method ? { method, password } : null;
}

function parseSS(uri) {
  const hashIdx = uri.indexOf('#');
  const tag = hashIdx !== -1 ? uri.slice(hashIdx + 1) : '';
  let body = hashIdx !== -1
    ? uri.slice('ss://'.length, hashIdx)
    : uri.slice('ss://'.length);
  body = body.trim();
  if (!body) return null;

  let query = '';
  const qIdx = body.indexOf('?');
  if (qIdx !== -1) {
    query = body.slice(qIdx + 1);
    body = body.slice(0, qIdx);
  }

  let userinfo, hostport;
  if (body.includes('@')) {
    // SIP002
    if (body.endsWith('/')) body = body.slice(0, -1);
    const atIdx = body.lastIndexOf('@');
    userinfo = body.slice(0, atIdx);
    hostport = body.slice(atIdx + 1);
  } else {
    // Legacy SS (base64)
    const decoded = b64DecodeUtf8(body);
    if (!decoded) return null;
    const atIdx = decoded.lastIndexOf('@');
    if (atIdx === -1) return null;
    userinfo = decoded.slice(0, atIdx);
    hostport = decoded.slice(atIdx + 1);
  }

  const lastColon = hostport.lastIndexOf(':');
  if (lastColon === -1) return null;
  const host = hostport.slice(0, lastColon);
  const port = parseInt(hostport.slice(lastColon + 1), 10);
  if (!host || isNaN(port)) return null;

  const cred = parseUserinfo(userinfo);
  if (!cred) return null;

  const plugin = query ? (new URLSearchParams(query).get('plugin') || '') : '';
  return { host, port, ...cred, plugin, tag };
}

function isWSandTLS(pluginStr) {
  if (!pluginStr) return false;
  const parts = pluginStr.toLowerCase().split(';').map((p) => p.trim()).filter(Boolean);

  const hasWS = parts.some((p) => /^mode\s*=\s*(websocket|ws)$/.test(p));
  const hasTLS = parts.some((p) =>
    p === 'tls' ||
    /^tls\s*=\s*(true|1)$/.test(p) ||
    /^security\s*=\s*tls$/.test(p)
  );

  return hasWS && hasTLS;
}

// ---------- main ----------
async function main() {
  const results = await fetchWithLimit(sourceUrls, CONCURRENCY_LIMIT);
  const texts = results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);

  if (texts.length === 0) {
    console.error('⚠️ All sources failed to fetch.');
  }

  const filteredConfigs = [];
  const seenConfigs = new Set();

  function processLine(line) {
    try {
      const info = parseSS(line);
      if (!info) return;
      if (info.port !== 443) return;              // شرط 1: port 443
      if (!isWSandTLS(info.plugin)) return;       // شرط 2+3: ws + tls

      const sig = JSON.stringify([
        'ss', info.host, info.port, info.method, info.password, info.plugin
      ]);
      
      if (seenConfigs.has(sig)) return;
      seenConfigs.add(sig);
      filteredConfigs.push(line);
    } catch (_) {}
  }

  for (const text of texts) {
    let content = text.includes('ss://') ? text : decodeIfBase64(text);

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('ss://')) {
        processLine(line);
      } else {
        const decoded = decodeIfBase64(line);
        if (decoded !== line) {
          for (const innerRaw of decoded.split(/\r?\n/)) {
            const inner = innerRaw.trim();
            if (inner.startsWith('ss://')) processLine(inner);
          }
        }
      }
    }
  }

  if (filteredConfigs.length === 0) {
    console.error('⚠️ No SS (443/ws/tls) configs found!');
    try {
      const old = await fs.readFile(OUTPUT_FILE, 'utf8');
      if (old.trim().length > 0) {
        console.warn(`ℹ️ Keeping existing ${OUTPUT_FILE} to avoid wiping.`);
        return;
      }
    } catch (_) {}
    process.exit(1);
  }

  await fs.writeFile(OUTPUT_FILE, filteredConfigs.join('\n'), 'utf8');
  console.log(`✅ Saved ${filteredConfigs.length} SS (443/ws/tls) configs to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
