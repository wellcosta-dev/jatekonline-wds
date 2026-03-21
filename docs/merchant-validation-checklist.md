# Merchant + Rich Results Validation Checklist

## 1) Feed ellenorzes

- Feed URL: `/google-merchant-feed.xml`
- Mintaellenorzes:
  - `g:id`, `g:title`, `g:description`, `g:link`, `g:image_link`
  - `g:availability`, `g:price`, `g:brand`, `g:product_type`
  - `g:google_product_category`, `g:identifier_exists`

## 2) Diagnostics API

- Admin endpoint: `/api/admin/seo/merchant-diagnostics`
- Cel: hianyzo SKU/kep/ar/GTIN jeloles gyors felderitese

## 3) Rich Results

- Product URL-k tesztelese:
  - Product schema ervenyessege
  - Offer mezok (price, availability)
  - MerchantReturnPolicy, shippingDetails

## 4) Merchant Center napi rutin

1. Disapproved itemek attekintese
2. Price mismatch hibak javitasa
3. Missing identifiers csokkentese
4. Feed fetch status ellenorzes
