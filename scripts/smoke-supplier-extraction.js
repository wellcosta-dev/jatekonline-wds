const urls = [
  "https://www.astibababolt.hu/FreeON-babakocsi-kiegeszitoFreeON-testverfellepo-u",
  "https://www.astibababolt.hu/FreeON-univerzalis-legatereszto-betet-babakocsiba",
];

async function main() {
  for (const url of urls) {
    const response = await fetch(url, {
      headers: { "user-agent": "BabyOnlineSupplierSyncSmoke/1.0" },
    });
    const html = await response.text();
    const sku =
      html.match(/artdet__sku-value[^>]*>\s*([^<\s]+)\s*</i)?.[1] ??
      html.match(/Cikksz[aá]m[\s\S]{0,180}?>([^<\s]{3,})</i)?.[1] ??
      "-";
    const priceRaw =
      html.match(/itemprop=["']price["'][^>]*content=["']([^"']+)["']/i)?.[1] ??
      html.match(/content=["']([^"']+)["'][^>]*itemprop=["']price["']/i)?.[1] ??
      "-";
    const ftCandidates = Array.from(
      html.matchAll(/([0-9][0-9 .]{1,15})\s*Ft/gi),
      (m) => m[1].replace(/\s+/g, " ").trim()
    ).slice(0, 12);
    const priceBlock = html.match(/artdet__price[\s\S]{0,1200}/i)?.[0] ?? "";
    const nettoBlock = html.match(/nettó[\s\S]{0,220}/i)?.[0] ?? "";
    const bruttoBlock = html.match(/bruttó[\s\S]{0,220}/i)?.[0] ?? "";
    const jsonPriceCandidates = Array.from(
      html.matchAll(/"price"\s*:\s*"?(?:HUF\s*)?([0-9][0-9.,]{1,10})"?/gi),
      (m) => m[1]
    ).slice(0, 20);
    const dataLayerPrices = Array.from(
      html.matchAll(/price[^0-9]{0,20}([0-9]{3,6})/gi),
      (m) => m[1]
    )
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 20);
    const hasKnown = html.includes("5141");
    const stockWord =
      html.match(/(nincs raktáron|elfogyott|raktáron|készleten|elérhető)/i)?.[1] ?? "-";

    console.log(url);
    console.log("status:", response.status);
    console.log("sku:", sku);
    console.log("price_raw:", priceRaw);
    console.log("ft_candidates:", ftCandidates.join(" | ") || "-");
    console.log("price_block:", priceBlock.replace(/\s+/g, " ").slice(0, 420));
    console.log("netto_block:", nettoBlock.replace(/\s+/g, " ").slice(0, 260));
    console.log("brutto_block:", bruttoBlock.replace(/\s+/g, " ").slice(0, 260));
    console.log("json_price_candidates:", jsonPriceCandidates.join(" | ") || "-");
    console.log("generic_price_candidates:", dataLayerPrices.join(" | ") || "-");
    console.log("contains_5141:", hasKnown);
    console.log("stock_word:", stockWord);
    console.log("---");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
