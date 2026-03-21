const baseUrl = "https://www.astibababolt.hu";
const candidates = ["/", "/belepes", "/bejelentkezes", "/login", "/fiok", "/fokom", "/account/login"];
const productUrl =
  "https://www.astibababolt.hu/FreeON-univerzalis-legatereszto-betet-babakocsiba";

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "BabyOnlineSupplierSyncDiscovery/1.0" },
    redirect: "follow",
  });
  return { res, text: await res.text() };
}

function extractFormHints(html) {
  const forms = html.match(/<form[\s\S]*?<\/form>/gi) ?? [];
  return forms.slice(0, 6).map((form) => {
    const action = form.match(/action=["']([^"']+)["']/i)?.[1] ?? "";
    const method = form.match(/method=["']([^"']+)["']/i)?.[1] ?? "post";
    const hasPassword = /type=["']password["']/i.test(form);
    const emailName = form.match(/name=["']([^"']*(?:email|user|felhasz)[^"']*)["']/i)?.[1] ?? "";
    const passName = form.match(/name=["']([^"']*(?:pass|jelsz)[^"']*)["']/i)?.[1] ?? "";
    return { action, method, hasPassword, emailName, passName };
  });
}

function parsePriceCandidates(html) {
  const json = Array.from(
    html.matchAll(/"price"\s*:\s*"?(?:HUF\s*)?([0-9][0-9.,]{1,10})"?/gi),
    (m) => m[1]
  );
  const ft = Array.from(html.matchAll(/([0-9][0-9 .]{1,15})\s*Ft/gi), (m) => m[1]);
  return { json: json.slice(0, 10), ft: ft.slice(0, 10) };
}

async function main() {
  for (const path of candidates) {
    const url = new URL(path, baseUrl).toString();
    try {
      const { res, text } = await fetchText(url);
      const links = Array.from(
        text.matchAll(/href=["']([^"']*(?:belep|bejelent|login|fiok|account)[^"']*)["']/gi),
        (m) => m[1]
      ).slice(0, 10);
      const forms = extractFormHints(text);
      console.log("url:", url, "status:", res.status, "final:", res.url);
      console.log("login_links:", links.join(" | ") || "-");
      console.log("form_hints:", JSON.stringify(forms));
      console.log("---");
    } catch (error) {
      console.log("url:", url, "error:", error instanceof Error ? error.message : String(error));
      console.log("---");
    }
  }

  const email = process.env.SUPPLIER_LOGIN_EMAIL?.trim();
  const password = process.env.SUPPLIER_LOGIN_PASSWORD?.trim();
  if (!email || !password) {
    console.log("No SUPPLIER_LOGIN_EMAIL/PASSWORD env set for login probe.");
    return;
  }

  const cookie = new Map();
  const getCookieHeader = () =>
    Array.from(cookie.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  const setCookies = (res) => {
    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) return;
    for (const part of setCookie.split(",")) {
      const pair = part.split(";")[0]?.trim();
      if (!pair || !pair.includes("=")) continue;
      const [name, ...values] = pair.split("=");
      cookie.set(name, values.join("="));
    }
  };

  const homeRes = await fetch(baseUrl + "/", {
    headers: { "user-agent": "BabyOnlineSupplierSyncDiscovery/1.0" },
  });
  setCookies(homeRes);
  const homeHtml = await homeRes.text();
  const forms = extractFormHints(homeHtml);
  const login = forms.find((f) => f.hasPassword && f.action.includes("shop_logincheck"));
  if (!login || !login.emailName || !login.passName) {
    console.log("Login form not detected for active auth probe.");
    return;
  }

  const body = new URLSearchParams({
    [login.emailName]: email,
    [login.passName]: password,
  }).toString();

  const loginRes = await fetch(login.action, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "BabyOnlineSupplierSyncDiscovery/1.0",
      cookie: getCookieHeader(),
    },
    body,
    redirect: "follow",
  });
  setCookies(loginRes);
  await loginRes.text();

  const prodRes = await fetch(productUrl, {
    headers: {
      "user-agent": "BabyOnlineSupplierSyncDiscovery/1.0",
      cookie: getCookieHeader(),
    },
  });
  const prodHtml = await prodRes.text();
  const sku = prodHtml.match(/artdet__sku-value[^>]*>\s*([^<\s]+)\s*</i)?.[1] ?? "-";
  const candidatesAfterLogin = parsePriceCandidates(prodHtml);
  console.log("AUTH_PROBE");
  console.log("product status:", prodRes.status, "url:", prodRes.url);
  console.log("sku:", sku);
  console.log("json prices:", candidatesAfterLogin.json.join(" | ") || "-");
  console.log("ft prices:", candidatesAfterLogin.ft.join(" | ") || "-");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
