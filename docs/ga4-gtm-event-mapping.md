# BabyOnline GA4 + GTM Event Mapping

Ez a dokumentum a webshopban jelenleg implementalt esemeny taxonomiat foglalja ossze, hogy a marketing meres GTM/GA4 oldalon gyorsan beallithato legyen.

## 1) Meresi alapok

- Data layer neve: `dataLayer`
- GTM env: `NEXT_PUBLIC_GTM_ID`
- GA4 env: `NEXT_PUBLIC_GA_ID` (csak fallback, GTM nelkul)
- Meta Pixel env: `NEXT_PUBLIC_META_PIXEL_ID`
- Site URL env: `NEXT_PUBLIC_SITE_URL`
- Script init: `components/analytics/AnalyticsScripts.tsx`
- Event helper: `lib/analytics.ts`

## 2) Ecommerce eventek (ajanlott funnel sorrend)

| Event nev | Mikor kuldjuk | Fo parameterek | Forras |
|---|---|---|---|
| `view_item_list` | Termeklista megjelenitesekor | `item_list_name`, `source_path`, `items[]` | `components/shop/ProductGrid.tsx` |
| `select_item` | Termekkartyara kattintas (navigacio) | `item_list_name`, `source_path`, `items[]` | `components/shop/ProductCard.tsx` |
| `view_item` | Termek reszletoldal betoltese | `currency`, `value`, `items[]` | `app/(shop)/termekek/[slug]/page.tsx` |
| `add_to_cart` | Kosarba tesz gomb | `currency`, `value`, `items[]` | `components/shop/ProductCard.tsx`, `app/(shop)/termekek/[slug]/page.tsx` |
| `view_cart` | Kosar oldal megnyitasa (de-duplicalt) | `currency`, `value`, `coupon`, `items[]` | `app/(shop)/kosar/page.tsx` |
| `apply_coupon` | Ervenyes kupon alkalmazasakor | `coupon` | `app/(shop)/kosar/page.tsx` |
| `begin_checkout` | Checkout funnel inditasakor | `currency`, `value`, `coupon`, `items[]` | `app/(shop)/rendeles/page.tsx` |
| `add_shipping_info` | Szallitasi lepes tovabblepes | `currency`, `value`, `coupon`, `shipping_tier`, `items[]` | `app/(shop)/rendeles/page.tsx` |
| `add_payment_info` | Fizetesi mod valasztas/leadashoz | `currency`, `value`, `coupon`, `payment_type`, `shipping_tier`, `event_id`, `items[]` | `app/(shop)/rendeles/page.tsx` |
| `purchase` | Sikeres rendeles (COD vagy Stripe visszaigazolas) | `transaction_id`, `currency`, `value`, `shipping`, `coupon`, `event_id`, `items[]` | `app/(shop)/rendeles/page.tsx`, `app/(shop)/rendeles/megerosites/page.tsx` |

## 3) `items[]` schema (egyseges)

Minden ecommerce esemenyben a helper ugyanazt az item formatot hasznalja:

- `item_id`
- `item_name`
- `item_category`
- `price`
- `quantity`
- `item_list_name` (ahol ertelmezett)

Implementacios helper:

- `toAnalyticsItem(...)`
- `toAnalyticsItemFromProduct(...)`

Fajl: `lib/analytics.ts`

## 4) GTM beallitasi javaslat (gyors setup)

1. Hozz letre egy GA4 Configuration taget.
2. Hozz letre 1-1 GA4 Event taget minden fenti event nevre.
3. Trigger: Custom Event, event nev = pontosan a fenti tabla szerinti nev.
4. Event parameter mapping:
   - egyszeru mezoket (pl. `value`, `currency`, `transaction_id`) direktben mapeld.
   - `items` parameter atadasa valtozo alapu JSON-kent.
5. Preview modban ellenorizd:
   - Data layer-ben megjelenik-e az event.
   - GA4 DebugView-ban latod-e az eventet es az `items` tombot.

## 5) QA checklist (release elott)

- `view_item_list` csak lista renderkor menjen, ne spameljen gorgeteskor.
- `begin_checkout` csak egyszer menjen session/funnel indulaskor.
- `purchase` csak sikeres backend valasz utan menjen.
- `coupon` only valid kuponnal menjen.
- `value` mindenhol HUF ertek legyen, numerikus tipussal.

## 6) Opcionlis kovetkezo kor (ha kell)

- Refund esemeny (`refund`) admin oldali statusz valtashoz kotve.
- Login/Register meres (`login`, `sign_up`) auth flow-ra.
- Search meres (`search`) a header autocomplete + keresesi oldalra.
- Promotion meres (`view_promotion`, `select_promotion`) homepage hero/banner blokkokra.

## 7) GTM JSON blueprint

GTM setup gyorsitasahoz keszult egy JSON sablon is:

- `docs/gtm-ga4-event-blueprint.json`
- `docs/gtm-container-minimal-export.json`
- `docs/gtm-import-checklist-10min.md`

- Az elso fajl naming + parameter blueprint.
- A masodik fajl import-kompatibilis minimal container export skeleton (GA4 config + custom event triggerek + GA4 event tagek).

Import utan csere:

1. `G-REPLACE_MEASUREMENT_ID` -> sajat GA4 Measurement ID
2. `GTM-XXXXXXX` -> opcionális, vagy uj kontenerben merge import

Fontos:

- GTM-központu uzemmodban az app csak `dataLayer` eventet kuld; direkt `gtag("event")` csak GTM nelkuli fallback eset.

## 8) Google Ads + Meta deduplikacio alap

- `purchase` esemenyhez kotelezo az `event_id` (frontend + server dedup).
- Google Ads purchase mapping alapja:
  - `transaction_id`
  - `value`
  - `currency`
- Meta hybrid:
  - Browser: Pixel `Purchase` ugyanazzal az `event_id`-val
  - Server: CAPI `Purchase` webhook/order alapon ugyanazzal az `event_id`-val
