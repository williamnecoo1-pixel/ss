const fs = require('fs/promises');

// الليستة ديال الروابط ديالك
const sourceUrls = [
    
     "https://github.com/liMilCo/v2r/raw/refs/heads/main/new_configs.txt",
     "https://github.com/Delta-Kronecker/V2ray-Config/raw/refs/heads/main/config/all_configs.txt",
    "https://raw.githubusercontent.com/mahdibland/V2RayAggregator/master/sub/sub_merge.txt",
    "https://raw.githubusercontent.com/IranianCypherpunks/sub/main/sub",
    "https://raw.githubusercontent.com/vfarid/v2ray-share/main/configs.txt",
    "https://raw.githubusercontent.com/iboxz/free-v2ray-collector/main/main/mix.txt",
    "https://raw.githubusercontent.com/Lidatong/v2ray_rules/master/all.txt",
  "https://raw.githubusercontent.com/ashah404/V2rayCollector/refs/heads/main/subscribe/layers/ipv4",
     "https://github.com/Mohamedhnini-a/testeur-2/raw/refs/heads/main/working_configs.txt",
    "https://github.com/Mohamedhnini-a/Neverstops-2/raw/refs/heads/main/sub.txt",
    "https://github.com/Tenerome/v2ray/raw/main/res/23-05/2023-05-12",
    "https://github.com/Tenerome/v2ray/raw/main/res/23-05/2023-05-13",
    "https://github.com/theGreatPeter/v2rayNodes/raw/main/nodes.txt",
    "https://raw.githubusercontent.com/10ium/V2Hub3/refs/heads/main/merged",
    "https://raw.githubusercontent.com/245237866/v2rayn/main/everydaynode",
    "https://raw.githubusercontent.com/ALIILAPRO/v2rayNG-Config/main/server.txt",
    "https://raw.githubusercontent.com/ALIILAPRO/v2rayNG-Config/refs/heads/main/server.txt",
    "https://raw.githubusercontent.com/Ashkan-m/v2ray/main/Sub.txt",
    "https://raw.githubusercontent.com/Ashkan-m/v2ray/refs/heads/main/Sub.txt",
    "https://raw.githubusercontent.com/Barabama/FreeNodes/main/nodes/clashmeta.txt",
    "https://raw.githubusercontent.com/Barabama/FreeNodes/main/nodes/ndnode.txt",
    "https://raw.githubusercontent.com/Barabama/FreeNodes/main/nodes/nodefree.txt",
    "https://raw.githubusercontent.com/Barabama/FreeNodes/main/nodes/nodev2ray.txt",
    "https://raw.githubusercontent.com/Barabama/FreeNodes/main/nodes/v2rayshare.txt",
    "https://raw.githubusercontent.com/Barabama/FreeNodes/main/nodes/wenode.txt",
    "https://raw.githubusercontent.com/Barabama/FreeNodes/main/nodes/yudou66.txt",
    "https://raw.githubusercontent.com/Barabama/FreeNodes/refs/heads/main/nodes/clashmeta.txt",
    "https://raw.githubusercontent.com/Barabama/FreeNodes/refs/heads/main/nodes/ndnode.txt",
    "https://raw.githubusercontent.com/Barabama/FreeNodes/refs/heads/main/nodes/nodefree.txt",
    "https://raw.githubusercontent.com/Barabama/FreeNodes/refs/heads/main/nodes/nodev2ray.txt",
    "https://raw.githubusercontent.com/Barabama/FreeNodes/refs/heads/main/nodes/v2rayshare.txt",
    "https://raw.githubusercontent.com/Barabama/FreeNodes/refs/heads/main/nodes/wenode.txt",
    "https://raw.githubusercontent.com/Barabama/FreeNodes/refs/heads/main/nodes/yudou66.txt",
    "https://raw.githubusercontent.com/Creativveb/v2configs/main/updated",
    "https://raw.githubusercontent.com/Delta-Kronecker/V2ray-Config/refs/heads/main/config/all_configs.txt",
    "https://raw.githubusercontent.com/Epodonios/v2ray-configs/main/Splitted-By-Protocol/vmess.txt",
    "https://raw.githubusercontent.com/Epodonios/v2ray-configs/refs/heads/main/All_Configs_Sub.txt",
    "https://raw.githubusercontent.com/Epodonios/v2ray-configs/refs/heads/main/Splitted-By-Protocol/vmess.txt",
    "https://raw.githubusercontent.com/Giromo0/Collector/refs/heads/main/All_Configs_Sub.txt",
    "https://raw.githubusercontent.com/HakurouKen/free-node/main/public",
    "https://raw.githubusercontent.com/IranianCypherpunks/Xray/main/Sub",
    "https://raw.githubusercontent.com/IranianCypherpunks/Xray/refs/heads/main/Sub",
    "https://raw.githubusercontent.com/Jia-Pingwa/free-v2ray-merge/main/output.txt",
    "https://raw.githubusercontent.com/LalatinaHub/Mineral/refs/heads/master/result/nodes",
    "https://raw.githubusercontent.com/MOnday9907/v2ray/main/v2ray.txt",
    "https://raw.githubusercontent.com/Mahanfix/v2rayvpn/main/mahanfix",
    "https://raw.githubusercontent.com/MahsaNetConfigTopic/config/refs/heads/main/xray_final.txt",
    "https://raw.githubusercontent.com/MatinGhanbari/v2ray-configs/main/subscriptions/v2ray/all_sub.txt",
    "https://raw.githubusercontent.com/MhdiTaheri/V2rayCollector/main/sub/hysteria",
    "https://raw.githubusercontent.com/MhdiTaheri/V2rayCollector/main/sub/mix",
    "https://raw.githubusercontent.com/MhdiTaheri/V2rayCollector/main/sub/ss",
    "https://raw.githubusercontent.com/MhdiTaheri/V2rayCollector/main/sub/trojan",
    "https://raw.githubusercontent.com/MhdiTaheri/V2rayCollector/main/sub/tuic",
    "https://raw.githubusercontent.com/MhdiTaheri/V2rayCollector/main/sub/vless",
    "https://raw.githubusercontent.com/MhdiTaheri/V2rayCollector/main/sub/vmess",
    "https://raw.githubusercontent.com/SamanValipour1/My-v2ray-configs/main/MySub.txt",
    "https://raw.githubusercontent.com/SamanValipour1/My-v2ray-configs/refs/heads/main/MySub.txt",
    "https://raw.githubusercontent.com/SoliSpirit/v2ray-configs/main/all_configs.txt",
    "https://raw.githubusercontent.com/Surfboardv2ray/TGParse/main/python/hy2",
    "https://raw.githubusercontent.com/Surfboardv2ray/TGParse/main/python/hysteria",
    "https://raw.githubusercontent.com/Surfboardv2ray/TGParse/main/python/hysteria2",
    "https://raw.githubusercontent.com/YasserDivaR/pr0xy/main/ShadowSocks2021.txt",
    "https://raw.githubusercontent.com/barry-far/V2ray-config/main/All_Configs_Sub.txt",
    "https://raw.githubusercontent.com/ebrasha/free-v2ray-public-list/refs/heads/main/all_extracted_configs.txt",
    "https://raw.githubusercontent.com/giromo/Collector/refs/heads/main/Splitted-By-Protocol/Hysteria2.txt",
    "https://raw.githubusercontent.com/giromo/Collector/refs/heads/main/Splitted-By-Protocol/WireGuard.txt",
    "https://raw.githubusercontent.com/giromo/Collector2/refs/heads/main/bulk/hysteria2_iran.txt",
    "https://raw.githubusercontent.com/giromo/Collector2/refs/heads/main/sub/sub_merge.txt",
    "https://raw.githubusercontent.com/giromo/Proxify/refs/heads/main/v2ray_configs/seperated_by_protocol/hysteria2.txt",
    "https://raw.githubusercontent.com/iboxz/free-v2ray-collector/main/main/shadowsocks",
    "https://raw.githubusercontent.com/iboxz/free-v2ray-collector/main/main/vless",
    "https://raw.githubusercontent.com/imohammadkhalili/V2RAY/main/Mkhalili",
    "https://raw.githubusercontent.com/jikelonglie/meskell/main/meskell",
    "https://raw.githubusercontent.com/kaoxindalao/v2raycheshi/main/v2raycheshi",
    "https://raw.githubusercontent.com/mahdibland/SSAggregator/master/sub/airport_sub_merge.txt",
    "https://raw.githubusercontent.com/mahdibland/SSAggregator/master/sub/sub_merge.txt",
    "https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/Eternity.txt",
    "https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/EternityAir.txt",
    "https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/sub/sub_merge.txt",
    "https://raw.githubusercontent.com/mahdibland/V2RayAggregator/master/sub/sub_merge.txt",
    "https://raw.githubusercontent.com/mermeroo/Loon/refs/heads/main/all.nodes.txt",
    "https://raw.githubusercontent.com/mermeroo/QX/refs/heads/main/Nodes",
    "https://raw.githubusercontent.com/parsashonam/v2ray/main/all",
    "https://raw.githubusercontent.com/resasanian/Mirza/main/mirza-ss.txt",
    "https://raw.githubusercontent.com/resasanian/Mirza/main/mirza-vless.txt",
    "https://raw.githubusercontent.com/resasanian/Mirza/main/mirza-vmess.txt",
    "https://raw.githubusercontent.com/roosterkid/openproxylist/refs/heads/main/V2RAY_RAW.txt",
    "https://raw.githubusercontent.com/vxiaov/free_proxies/main/links.txt",
    "https://raw.githubusercontent.com/vxiaov/free_proxies/refs/heads/main/links.txt",
    "https://raw.githubusercontent.com/xiaoji235/airport-free/main/v2ray.txt",
    "https://raw.githubusercontent.com/xiaoji235/airport-free/main/v2ray/v2rayshare.txt",
    "https://raw.githubusercontent.com/yaney01/NoMoreWalls/refs/heads/master/list_raw.txt",
    "https://raw.githubusercontent.com/yaney01/autoproxy/refs/heads/master/sub/splitted/vmess.txt",
    "https://raw.githubusercontent.com/youfoundamin/V2rayCollector/main/mixed_iran.txt",
    "https://raw.githubusercontent.com/youfoundamin/V2rayCollector/main/ss_iran.txt",
    "https://raw.githubusercontent.com/youfoundamin/V2rayCollector/main/vless_iran.txt",
    "https://raw.githubusercontent.com/youfoundamin/V2rayCollector/main/vmess_iran.txt"
     
];

const FETCH_TIMEOUT_MS = 30_000;
const CONCURRENCY_LIMIT = 30;

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

function decodeIfBase64(text) {
  try {
    const cleaned = text.trim().replace(/\s+/g, '');
    const normalized = cleaned.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = Buffer.from(padded, 'base64').toString('utf8');

    if (!isPrintableText(decoded)) return text;

    if (
      decoded.includes('vless://') ||
      decoded.includes('trojan://') ||
      decoded.includes('vmess://')
    ) {
      return decoded;
    }
  } catch (_) {}

  return text;
}

function b64DecodeUtf8(b64) {
  try {
    b64 = b64.trim().replace(/\s/g, '');
    b64 += '='.repeat((4 - (b64.length % 4)) % 4);
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

function b64EncodeUtf8(str) {
  return Buffer.from(str, 'utf8').toString('base64');
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

async function main() {
  const results = await fetchWithLimit(sourceUrls, CONCURRENCY_LIMIT);

  const texts = results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);

  if (texts.length === 0) {
    console.error('⚠️ All sources failed to fetch.');
  }

  const filteredConfigs = [];
  
  // ============================================================
  // Sets ديال الفلترة (Dedupe)
  // ============================================================
  const seenVless = new Set();
  const seenVmess = new Set();
  const seenTrojan = new Set();

  for (const text of texts) {
    let decodedText = text;

    if (
      !text.includes('vless://') &&
      !text.includes('trojan://') &&
      !text.includes('vmess://')
    ) {
      decodedText = decodeIfBase64(text);
    }

    const lines = decodedText.split(/\r?\n/);

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // ==========================================
      // 1. VMess
      // ==========================================
      if (line.startsWith('vmess://')) {
        try {
          const cleanLine = line.split('#')[0];
          const b64 = cleanLine.slice(8).trim();
          const jsonStr = b64DecodeUtf8(b64);
          if (!jsonStr) continue;

          const config = JSON.parse(jsonStr);

          if (
            String(config.net || '').toLowerCase() !== 'ws' ||
            String(config.tls || '').toLowerCase() !== 'tls' ||
            parseInt(config.port, 10) !== 443
          ) {
            continue;
          }

          // ✅ فلترة التكرار حسب الـ ID فقط
          const vmessId = String(config.id || '').toLowerCase().trim();
          if (!vmessId || seenVmess.has(vmessId)) continue;
          seenVmess.add(vmessId);

          const server = String(config.add || '').toLowerCase().trim();
          if (!server) continue;

          // 🔵 كنحافظو على الـ host الأصلي كيفما هو (بلا تبديل)

          filteredConfigs.push('vmess://' + b64EncodeUtf8(JSON.stringify(config)));
        } catch (_) {}
        continue;
      }

      // ==========================================
      // 2. VLESS / Trojan
      // ==========================================
      const cleanLine = line.split('#')[0].trim();
      if (
        !cleanLine.startsWith('vless://') &&
        !cleanLine.startsWith('trojan://')
      ) {
        continue;
      }

      try {
        const url = new URL(cleanLine);
        const protocol = url.protocol.replace(':', '').toLowerCase();
        const port = url.port === '' ? 443 : parseInt(url.port, 10);

        if (
          (protocol !== 'vless' && protocol !== 'trojan') ||
          url.searchParams.get('type') !== 'ws' ||
          url.searchParams.get('security') !== 'tls' ||
          port !== 443
        ) {
          continue;
        }

        const username = url.username.toLowerCase().trim();
        if (!username) continue;

        // ✅ فلترة VLESS حسب الـ UUID فقط
        if (protocol === 'vless') {
          if (seenVless.has(username)) continue;
          seenVless.add(username);
        }

        // ✅ فلترة Trojan حسب الـ Password فقط
        if (protocol === 'trojan') {
          if (seenTrojan.has(username)) continue;
          seenTrojan.add(username);
        }

        // 🔵 كنحافظو على الـ hostname الأصلي كيفما هو (بلا تبديل)

        let finalConfig = url.toString();
        const originalRemark = line.split('#')[1];
        if (originalRemark) finalConfig += `#${originalRemark}`;

        filteredConfigs.push(finalConfig);
      } catch (_) {}
    }
  }

  if (filteredConfigs.length === 0) {
    console.error('⚠️ No configs found! All sources failed or filter too strict.');
    try {
      const old = await fs.readFile('sub.txt', 'utf8');
      if (old.trim().length > 0) {
        console.warn('ℹ️ Keeping existing sub.txt to avoid wiping the subscription.');
        return;
      }
    } catch (_) {}
    process.exit(1);
  }

  await fs.writeFile('sub.txt', filteredConfigs.join('\n'), 'utf8');
  console.log(`✅ Saved ${filteredConfigs.length} configs to sub.txt`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
