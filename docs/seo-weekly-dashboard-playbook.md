# SEO Weekly Dashboard Playbook (HU webshop)

## Heti rituale (30-45 perc)

1. `GET /api/admin/seo/kpi` ellenorzes (bevetel, fizetett rendeles, AOV).
2. Search Console:
   - Top queryk (non-brand kulcsszavak)
   - Top landing page-ek
   - CTR es atlag pozicio valtozas
3. Google Merchant Center:
   - Diagnostics hibak
   - Elutasitott termekek listaja
   - Feed frissules timestamp

## KPI-k, amiket kovessetek

- Organic clicks (GSC)
- Organic CTR (GSC)
- Avg position (GSC)
- Paid order count 7d (API)
- Revenue 7d (API)
- AOV 7d (API)
- Merchant disapproved items (GMC)

## Ketheti backlog ciklus (60 perc)

1. Rossz CTR + jo pozicio oldalakon:
   - title / meta description ujrairas
2. Jo forgalmu, gyenge konverzios oldalakon:
   - hero copy, trust USP, belso link, CTA finomhangolas
3. Merchant hibak:
   - missing identifier/image/pricing mismatch javitas

## API endpoint

- Admin only: `/api/admin/seo/kpi`
- Celuja: gyors heti kpi snapshot (7 nap, 14 nap)
