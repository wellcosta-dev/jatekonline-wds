import test from "node:test";
import assert from "node:assert/strict";
import {
  parseStoresWithStock,
  unquoteJsSingleQuotedString,
} from "./regio-stores-parse.mjs";

test("unquoteJsSingleQuotedString: escaped quotes → valid JSON", () => {
  const src = String.raw`JSON.parse('[{\"store_id\":\"27\",\"name\":\"X\"}]')`;
  const key = "JSON.parse('";
  const start = src.indexOf(key) + key.length;
  const { text } = unquoteJsSingleQuotedString(src, start);
  const arr = JSON.parse(text);
  assert.equal(arr.length, 1);
  assert.equal(arr[0].store_id, "27");
});

test("parseStoresWithStock: window.stores_with_stock forma (mint a nyilvános oldal)", () => {
  const html = `<html><body><script id="stores_with_stock">
        try {
            window.stores_with_stock = JSON.parse('[{\\"store_id\\":\\"27\\",\\"name\\":\\"Ny\\u00edregyh\\u00e1za\\"}]');
        } catch (e) {}
</script></body></html>`;
  const stores = parseStoresWithStock(html);
  assert.ok(Array.isArray(stores));
  assert.equal(stores.length, 1);
  assert.equal(String(stores[0].store_id), "27");
});

test("parseStoresWithStock: hiányzó script → null", () => {
  assert.equal(parseStoresWithStock("<html></html>"), null);
});

test("élő www termékoldal: script parse (hálózat)", async () => {
  const url =
    "https://www.regiojatek.hu/termek-05281-aranyasok-kartyajatek-kiegeszito.html";
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; RegioStockProbe/1.0)" },
  });
  assert.ok(res.ok, `HTTP ${res.status}`);
  const html = await res.text();
  assert.match(html, /btn-show-stores/);
  const stores = parseStoresWithStock(html);
  assert.ok(Array.isArray(stores), "stores tömb");
  assert.ok(stores.length > 0, "van legalább egy üzlet");
  const ids = new Set(stores.map((x) => String(x?.store_id)));
  assert.ok(ids.has("27"), "benne van Nyíregyháza (27) a példa terméknél");
});
