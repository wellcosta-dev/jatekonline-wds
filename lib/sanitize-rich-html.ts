const SCRIPT_BLOCK_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const IFRAME_BLOCK_RE = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
const OBJECT_BLOCK_RE = /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi;
const EMBED_BLOCK_RE = /<embed\b[^>]*>/gi;
const FORM_BLOCK_RE = /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi;
const META_LINK_BASE_RE = /<(meta|link|base)\b[^>]*>/gi;
const EVENT_HANDLER_ATTR_RE = /\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const SRCDOC_ATTR_RE = /\ssrcdoc\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const JS_URL_ATTR_RE =
  /\s(href|src|action|xlink:href)\s*=\s*(['"])\s*(javascript:|data:text\/html)[\s\S]*?\2/gi;

/**
 * Lightweight HTML sanitizer for CMS/product-rich content.
 * Removes executable content while preserving presentational markup.
 */
export function sanitizeRichHtml(input: string): string {
  if (!input) return "";

  return input
    .replace(SCRIPT_BLOCK_RE, "")
    .replace(IFRAME_BLOCK_RE, "")
    .replace(OBJECT_BLOCK_RE, "")
    .replace(EMBED_BLOCK_RE, "")
    .replace(FORM_BLOCK_RE, "")
    .replace(META_LINK_BASE_RE, "")
    .replace(EVENT_HANDLER_ATTR_RE, "")
    .replace(SRCDOC_ATTR_RE, "")
    .replace(JS_URL_ATTR_RE, "");
}
