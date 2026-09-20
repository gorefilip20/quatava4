#!/usr/bin/env node

const siteUrl = process.env.SITE_URL || "https://getquatava.com";
const expectedMarkers = ["Neon Genesis #01", "Midnight Circuit #07", "Aurora Relic #12"];
const attempts = Number.parseInt(process.env.CHECK_ATTEMPTS || "30", 10);
const delayMs = Number.parseInt(process.env.CHECK_DELAY_MS || "20000", 10);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Quatava-deployment-monitor/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  return { response, text: await response.text() };
}

async function check() {
  const page = await fetchText(`${siteUrl}/en/nft/marketplace?deployment_check=${Date.now()}`);
  const html = page.text;
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)].map((match) => match[1]);
  const scriptUrls = [...new Set(scripts)].map((src) => new URL(src, siteUrl).toString());

  const bundleTexts = await Promise.all(
    scriptUrls.map(async (url) => {
      try {
        return (await fetchText(url)).text;
      } catch {
        return "";
      }
    }),
  );

  const combined = `${html}\n${bundleTexts.join("\n")}`;
  const foundMarkers = expectedMarkers.filter((marker) => combined.includes(marker));
  const hasFallbackCode = combined.includes("demo-fallback") || combined.includes("NEXT_PUBLIC_DEMO_FALLBACK");

  return {
    pageStatus: page.response.status,
    scriptCount: scriptUrls.length,
    foundMarkers,
    hasFallbackCode,
    ready: page.response.ok && hasFallbackCode && foundMarkers.length === expectedMarkers.length,
  };
}

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    const result = await check();
    console.log(`[${new Date().toISOString()}] attempt ${attempt}/${attempts}`, JSON.stringify(result));
    if (result.ready) {
      console.log(`DEPLOYMENT_READY: ${siteUrl} is serving the new frontend demo fallback bundle.`);
      process.exit(0);
    }
  } catch (error) {
    console.log(`[${new Date().toISOString()}] attempt ${attempt}/${attempts} check failed: ${error.message}`);
  }

  if (attempt < attempts) await sleep(delayMs);
}

console.error(`DEPLOYMENT_NOT_READY: ${siteUrl} did not serve all expected demo markers after ${attempts} attempts.`);
console.error("This does not prove the build failed; inspect the Hostinger build/runtime logs and cache status.");
process.exit(1);
