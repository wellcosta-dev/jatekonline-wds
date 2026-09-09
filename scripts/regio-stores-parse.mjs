/**
 * Regio termékoldal <script id="stores_with_stock"> tartalmából kinyeri a készleten lévő üzletek tömbjét.
 * A böngészőben a JSON.parse('...') argumentuma JS single-quoted string: a \" és \\ szekvenciákat fel kell oldani,
 * mielőtt JSON.parse futna (lásd www.regiojatek.hu termékoldalak).
 */

/**
 * @param {string} src
 * @param {number} startIdx — az első karakter a nyitó ' után
 * @returns {{ text: string, end: number }}
 */
export function unquoteJsSingleQuotedString(src, startIdx) {
  let i = startIdx;
  let s = "";
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      const n = src[i + 1] ?? "";
      if (n === "'" || n === '"' || n === "\\") {
        s += n;
        i += 2;
        continue;
      }
      if (n === "n") {
        s += "\n";
        i += 2;
        continue;
      }
      if (n === "r") {
        s += "\r";
        i += 2;
        continue;
      }
      if (n === "t") {
        s += "\t";
        i += 2;
        continue;
      }
      if (
        n === "u" &&
        i + 6 <= src.length &&
        /^[0-9a-fA-F]{4}$/.test(src.slice(i + 2, i + 6))
      ) {
        s += String.fromCodePoint(parseInt(src.slice(i + 2, i + 6), 16));
        i += 6;
        continue;
      }
      s += n;
      i += 2;
      continue;
    }
    if (c === "'") return { text: s, end: i + 1 };
    s += c;
    i++;
  }
  return { text: s, end: i };
}

/**
 * @param {string} html
 * @returns {unknown[] | null}
 */
export function parseStoresWithStock(html) {
  const re =
    /<script\s+id=["']stores_with_stock["'][^>]*>([\s\S]*?)<\/script>/i;
  const m = html.match(re);
  if (!m) return null;
  const body = m[1];
  const win = "window.stores_with_stock = JSON.parse('";
  const plain = "JSON.parse('";
  let innerStart = -1;
  const pw = body.indexOf(win);
  if (pw !== -1) innerStart = pw + win.length;
  else {
    const pp = body.indexOf(plain);
    if (pp !== -1) innerStart = pp + plain.length;
  }
  if (innerStart === -1) return null;
  const { text } = unquoteJsSingleQuotedString(body, innerStart);
  try {
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch {
    return null;
  }
}
