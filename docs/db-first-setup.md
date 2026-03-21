# DB-first setup (local + VPS)

## 1) Indits local Postgres adatbazist

Hasznalhatsz Docker-t:

```bash
docker run --name babyonline-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=babyonline -p 5432:5432 -d postgres:16
```

## 2) Allitsd be az env-et

`.env.local`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/babyonline?schema=public"
```

## 3) Prisma schema szinkron

```bash
npm run db:generate
npm run db:push
```

## 4) Alkalmazas inditas

```bash
npm run dev
```

## Mi tortenik automatikusan?

- A storage reteg (`readJsonFile`/`writeJsonFile`) DB-be ment (`AppState`) ha van `DATABASE_URL`.
- Product katalogus elso DB hasznalatnal automatikusan seedelve lesz:
  - alap katalogus (`lib/product-data.ts`)
  - + override adatok (`data/product-overrides.json`)
- Users es Orders: ha DB ures, egyszeri bootstrap import tortenik a korabbi JSON allomanyokbol.

## VPS checklist

- `DATABASE_URL` beallitva production env-ben.
- `npm run db:generate && npm run db:push` lefut deployment alatt vagy elotte.
- API health endpoint ellenorzes: `/api/health` -> `databaseConfigured: true`.
