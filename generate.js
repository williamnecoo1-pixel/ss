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
  // زدت هاد المصادر باش نضمنو نلقاو شي SS
  "https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/Eternity.txt",
  "https://raw.githubusercontent.com/mfuu/v2ray/master/ss.txt"
];

const FETCH_TIMEOUT_MS = 30_000;
const CONCURRENCY_LIMIT = 30;
const OUTPUT_FILE = 'sub.txt';

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
          .then((res) => res.ok ? res.text() : '')
          .catch(() => '')
      )
    );
    results.push(...batchResults);
  }
  return results;
}

// ---------- Clash YAML Parser (لـ _SS.yaml) ----------
function parseClashYaml(text) {
  const results = [];
  const lines = text.split('\n');
  let current = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    if (line.startsWith('- ') && !line.startsWith('- {') || line.startsWith('proxies:')) {
      if (line.startsWith('proxies:')) continue;
      if (current && current.type === 'ss') results.push(current);
      current = {};
      const nameMatch = line.match(/^-\s*name:\s*['"]?([^'"]+)['"]?/);
      if (nameMatch) current.name = nameMatch[1];
    } else if (current && line.includes(':')) {
      const idx = line.indexOf(':');
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      
      if (key === 'type') current.type = val;
      else if (key === 'server') current.server = val;
      else if (key === 'port') current.port = parseInt(val, 10);
      else if (key === 'cipher') current.cipher = val;
      else if (key === 'password') current.password = val;
      else if (key === 'plugin') current.plugin = val;
      else if (key === 'mode' && current.plugin) current.pluginMode = val;
      else if (key === 'tls') current.tls = val;
      else if (key === 'host' && current.plugin) current.pluginHost = val;
      else if (key === 'path' && current.plugin) current.pluginPath = val;
    }
  }
  if (current && current.type === 'ss') results.push(current);

  const uris = [];
  for (const p of results) {
    if (!p.server || !p.port || !p.cipher || !p.password) continue;
    const userinfo = Buffer.from(`${p.cipher}:${p.password}`).toString('base64').replace(/=/g, '');
    let uri = `ss://${userinfo}@${p.server}:${p.port}`;
    if (p.plugin) {
      let pluginStr = p.plugin;
      if (p.pluginMode) pluginStr += `;mode=${p.pluginMode}`;
      if (p.tls === 'true') pluginStr += `;tls`;
      if (p.pluginHost) pluginStr += `;host=${p.pluginHost}`;
      if (p.pluginPath) pluginStr += `;path=${p.pluginPath}`;
      uri += `/?plugin=${encodeURIComponent(pluginStr)}`;
    }
    if (p.name) uri += `#${encodeURIComponent(p.name)}`;
    uris.push(uri);
  }
  return uris;
}

// ---------- SS parsing ----------
function parseUserinfo(userinfo) {
  if (!userinfo) return null;
  if (userinfo.includes(':')) {
    const idx = userinfo.indexOf(':');
    return { method: userinfo.slice(0, idx), password: userinfo.slice(idx + 1) };
  }
  const decoded = b64DecodeUtf8(userinfo);
  if (!decoded || !decoded.includes(':')) return null;
  const idx = decoded.indexOf(':');
  return { method: decoded.slice(0, idx), password: decoded.slice(idx + 1) };
}

function parseSS(uri) {
  const hashIdx = uri.indexOf('#');
  const tag = hashIdx !== -1 ? uri.slice(hashIdx + 1) : '';
  let body = hashIdx !== -1 ? uri.slice('ss://'.length, hashIdx) : uri.slice('ss://'.length);
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
    if (body.endsWith('/')) body = body.slice(0, -1);
    const atIdx = body.lastIndexOf('@');
    userinfo = body.slice(0, atIdx);
    hostport = body.slice(atIdx + 1);
  } else {
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
  const hasTLS = parts.some((p) => p === 'tls' || /^tls\s*=\s*(true|1)$/.test(p) || /^security\s*=\s*tls$/.test(p));
  return hasWS && hasTLS;
}

// ---------- main ----------
async function main() {
  const results = await fetchWithLimit(sourceUrls, CONCURRENCY_LIMIT);
  const texts = results.filter((r) => r.status === 'fulfilled' && r.value).map((r) => r.value);

  const filteredConfigs = [];
  const seenConfigs = new Set();

  function processLine(line) {
    try {
      const info = parseSS(line);
      if (!info) return;
      if (info.port !== 443) return;              // شرط 1: port 443
      if (!isWSandTLS(info.plugin)) return;       // شرط 2+3: ws + tls

      const sig = JSON.stringify(['ss', info.host, info.port, info.method, info.password, info.plugin]);
      if (seenConfigs.has(sig)) return;
      seenConfigs.add(sig);
      filteredConfigs.push(line);
    } catch (_) {}
  }

  for (const text of texts) {
    // 1. واش هو Clash YAML؟
    if (text.includes('type: ss') || text.includes('type: "ss"') || text.includes("type: 'ss'")) {
      const yamlUris = parseClashYaml(text);
      for (const uri of yamlUris) processLine(uri);
      continue;
    }

    // 2. يلا ماشي YAML، نعالجو كـ نص عادي أو Base64
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
    console.error('⚠️ No SS (443/ws/tls) configs found in the provided sources.');
    try {
      const old = await fs.readFile(OUTPUT_FILE, 'utf8');
      if (old.trim().length > 0) {
        console.warn(`ℹ️ Keeping existing ${OUTPUT_FILE} to avoid wiping.`);
        process.exit(0); // كنخرجو بنجاح باش ما يطيحش الـ Action
      }
    } catch (_) {}
    
    // يلا ما كاينش حتى ملف قديم، كنكتبو تعليق باش git add ينجح
    await fs.writeFile(OUTPUT_FILE, '# No SS (443/ws/tls) configs found at the moment.\n', 'utf8');
    process.exit(0);
  }

  await fs.writeFile(OUTPUT_FILE, filteredConfigs.join('\n'), 'utf8');
  console.log(`✅ Saved ${filteredConfigs.length} SS (443/ws/tls) configs to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
