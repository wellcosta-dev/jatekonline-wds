# GTM Import Checklist (10 perc)

Ez a lista a `docs/gtm-container-minimal-export.json` importja utani gyors, gyakorlati beallitasokhoz keszult.

## 1) Import

1. Nyisd meg a GTM containert.
2. Menj az **Admin -> Import Container** menupontba.
3. Valaszd ki: `docs/gtm-container-minimal-export.json`.
4. Import mod:
   - javasolt: **Merge**
   - konfliktusnal: **Rename conflicting**
5. Confirm.

## 2) GA4 Config tag

Tag neve: `GA4 - Config`

Ellenorizd:

- `measurementId` = sajat GA4 ID (pl. `G-XXXXXXXXXX`)
- Trigger: **Initialization - All Pages** vagy **All Pages** (projekt policy szerint)
- `sendPageView`: maradhat `true` (ha kulon page_view nincs kuldve mashonnan)

## 3) Event tagek gyors ellenorzes

Minden `GA4 - Event - ...` tagben:

- `eventName` egyezik a trigger event nevel
- `measurementId` hivatkozas: `GA4 - Config`
- firing option: `ONCE_PER_EVENT`

Erintett eventek:

- `view_item_list`
- `select_item`
- `view_item`
- `add_to_cart`
- `view_cart`
- `apply_coupon`
- `begin_checkout`
- `add_shipping_info`
- `add_payment_info`
- `purchase`

## 4) Trigger ellenorzes

Minden `CE - ...` triggernel:

- Trigger type: `Custom Event`
- Filter: `{{_event}} equals <event_name>`
- event nev pontosan ugyanaz, mint a frontendben kuldott `trackEvent(...)` nev

## 5) Debug (Preview)

1. Kattints a **Preview** gombra.
2. Nyisd meg a webshopot.
3. Menj vegig gyorsan:
   - termeklista
   - termekkartya katt
   - termekoldal
   - kosarba tesz
   - kosar
   - kupon
   - checkout flow
   - sikeres rendelesc
4. Ellenorizd, hogy a megfelelo tagek fired statuszba kerulnek.

## 6) GA4 DebugView ellenorzes

GA4 -> Admin -> DebugView:

- latszanak az eventek idorendben
- `items` parameter jelen van ecommerce eventeknel
- `transaction_id` csak `purchase` eseten jelenik meg

## 7) Duplikacio kontroll

Ha GTM kuldi az eventeket, akkor keruld a parhuzamos, ugyanarra az eventre allitott masik kuldest:

- ne legyen ugyanarra az eventre kulon GTM + kulon custom script duplikacio
- kulonosen figyelj: `purchase`, `begin_checkout`, `add_to_cart`

## 8) Publish

1. Adj verziot: pl. `GA4 ecommerce baseline`
2. Publish.
3. Rogzitsd a valtozas idopontjat a belso changelogban.

## 9) Gyors hibakereses

Ha nem jon adat:

- ellenorizd a `NEXT_PUBLIC_GTM_ID` es `NEXT_PUBLIC_GA_ID` env valtozokat
- nezd meg, hogy a `dataLayer` event tenylegesen pusholodik-e
- Trigger filter ne legyen elirva (`_event` nev)
- adblock/consent blokkolja-e az analytics scriptet
