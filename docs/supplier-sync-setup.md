# Beszállítói szinkron beállítás

Ez a modul automatikusan frissíti a termékek `purchasePrice` és `stock` mezőit a `supplierUrl` alapján.

## Működés

- SKU biztonsági ellenőrzés:
  - belső SKU: `FREEON-48723`
  - beszállítói oldalon kötelező találat: `48723`
  - ha nem egyezik, akkor a rendszer átirányítás/eltérés miatt `stock = 0`-ra állít.
- Készlet szabály:
  - ha beszállítónál készleten: `stock = 10`
  - ha nem készleten / nem azonosítható: `stock = 0`
- Beszerzési ár:
  - ha kiolvasható az oldalból, frissül a `purchasePrice`.

## Környezeti változók

`.env.local`:

```bash
SUPPLIER_LOGIN_EMAIL=hello@babyonline.hu
SUPPLIER_LOGIN_PASSWORD=Snowgoons13K.
SUPPLIER_SYNC_AUTO_DAILY=true
SUPPLIER_SYNC_CRON_SECRET=eros_titok_ertek
```

Megjegyzés: ha a beszállítói oldal publikus és nem kér login-t, a login mezők nélkül is fut.

## Admin használat

- Oldal: `admin/termekek`
- Gombok:
  - `Teszt futtatás (3 termék)`
  - `Teljes szinkron`
  - soronkénti egyedi frissítés gomb
- Látható:
  - utolsó sikeres futás ideje
  - sikeres/hibás/frissített darabszám

## Napi automata futás

Két mód:

1. **Passzív automata futás**: a rendszer API forgalomnál ellenőrzi, hogy eltelt-e 24 óra, és ha igen, háttérben indít egy teljes szinkront.
2. **Aktív cron futás** (ajánlott VPS-en): hívd naponta egyszer:

```bash
curl "https://<domain>/api/cron/supplier-sync?key=<SUPPLIER_SYNC_CRON_SECRET>"
```

Linux crontab példa (minden nap 03:20):

```bash
20 3 * * * curl -fsS "https://<domain>/api/cron/supplier-sync?key=<SUPPLIER_SYNC_CRON_SECRET>" >/dev/null
```
