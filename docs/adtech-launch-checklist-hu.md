# BabyOnline HU ad-tech launch checklist

## 1) GTM / GA4

- GTM Preview-ben lathato minden ecommerce event (`view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info`, `purchase`).
- GA4 DebugView-ban ellenorizve:
  - `transaction_id` jelen van `purchase` eseten
  - `value` es `currency` helyes (`HUF`)
  - `event_id` jelen van `purchase` eseten
- Duplazodas ellenorzes: egy vasarlas egy darab `purchase` event.

## 2) Google Ads

- Purchase conversion action import/utvonal kesz.
- Remarketing kozonsegek adatfolyama elindult.
- Consent Mode v2 allapotok megfelelok (ad storage / analytics storage).

## 3) Meta Pixel + CAPI

- Browser Pixel `Purchase` event megjelenik Event Managerben.
- Server CAPI `Purchase` event megjelenik Event Managerben.
- Deduplikacio mukodik (azonos `event_id` browser + server oldalon).
- Event Match Quality ellenorizve (email hash + fbp/fbc ahol elerheto).

## 4) Merchant Center (HU)

- Feed URL: `/google-merchant-feed.xml` sikeres, XML valid.
- Mintatermekek:
  - helyes `price`
  - helyes `sale_price` (ha van)
  - `brand`, `mpn`, `gtin` megfelelo
  - `availability` es landing oldal konzisztens
- Diagnostics warning trend monitorozas napi szinten az indulasi idoszakban.
- Misrepresentation gate (kotelezo launch elott):
  - nincs placeholder fo kep feedelt termeknel
  - nincs 0 vagy ervenytelen ar
  - visszakuldesi ido (nap) egyezik a policy oldalon es a termek schema-ban
  - termek azonositok: GTIN vagy MPN/SKU konzisztens, nem belso random ID

## 5) Rollback / biztonsag

- Meta CAPI hiba nem blokkolhat rendelest.
- Stripe webhook idempotens, CAPI kuldes ujraprobalkozasbarat.
- Kritikus env-k ellenorzese deploy elott:
  - `NEXT_PUBLIC_GTM_ID`
  - `NEXT_PUBLIC_META_PIXEL_ID`
  - `META_PIXEL_ID`
  - `META_ACCESS_TOKEN`
  - `NEXT_PUBLIC_GA_ID` (ha GTM nelkul fallback kell)
