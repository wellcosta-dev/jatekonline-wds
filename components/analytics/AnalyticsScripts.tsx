 "use client";

import Script from "next/script";

const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim();
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();
const cookiebotId = "7d285d16-9001-408d-87f4-7febc70ff8c6";

export function AnalyticsScripts() {
  return (
    <>
      <Script
        id="cookiebot-cmp"
        src="https://consent.cookiebot.com/uc.js"
        data-cbid={cookiebotId}
        data-blockingmode="auto"
        type="text/javascript"
        strategy="beforeInteractive"
      />
      <Script
        id="google-consent-mode-default"
        data-cookieconsent="ignore"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            window.gtag = window.gtag || gtag;
            gtag("consent", "default", {
              ad_personalization: "denied",
              ad_storage: "denied",
              ad_user_data: "denied",
              analytics_storage: "denied",
              functionality_storage: "denied",
              personalization_storage: "denied",
              security_storage: "granted",
              wait_for_update: 500
            });
            gtag("set", "ads_data_redaction", true);
            gtag("set", "url_passthrough", false);
          `,
        }}
      />
      <Script
        id="google-consent-mode-cookiebot-sync"
        data-cookieconsent="ignore"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              function syncConsent() {
                if (!window.gtag) return;
                var consent = (window.Cookiebot && window.Cookiebot.consent) ? window.Cookiebot.consent : null;
                if (!consent) return;
                window.gtag("consent", "update", {
                  ad_storage: consent.marketing ? "granted" : "denied",
                  ad_user_data: consent.marketing ? "granted" : "denied",
                  ad_personalization: consent.marketing ? "granted" : "denied",
                  analytics_storage: consent.statistics ? "granted" : "denied",
                  functionality_storage: consent.preferences ? "granted" : "denied",
                  personalization_storage: consent.preferences ? "granted" : "denied",
                  security_storage: "granted"
                });
              }
              window.addEventListener("CookiebotOnConsentReady", syncConsent);
              window.addEventListener("CookiebotOnAccept", syncConsent);
              window.addEventListener("CookiebotOnDecline", syncConsent);
            })();
          `,
        }}
      />
      {gtmId ? (
        <>
          <Script
            id="gtm-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      ) : null}

      {!gtmId && gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('set', 'linker', { accept_incoming: true });
                gtag('config', '${gaId}');
                ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ""}
              `,
            }}
          />
        </>
      ) : null}
      {metaPixelId ? (
        <Script
          id="meta-pixel-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      ) : null}
    </>
  );
}
