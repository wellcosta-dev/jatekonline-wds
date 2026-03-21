# BabyOnline.hu – Baba-Mama Webshop

Prémium magyar baba-mama e-commerce webshop Next.js 14+ alapokon, AI-vezérelt funkciókkal.

## Technológiai Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer Motion
- **State**: Zustand (kosár, UI)
- **Forms**: React Hook Form + Zod
- **Backend**: Next.js API Routes
- **Adatbázis**: Supabase (PostgreSQL) + Prisma ORM
- **AI**: OpenAI GPT-4o (chatbot, termékleírás, blog)
- **Fizetés**: Stripe
- **Számlázás**: Billingo API
- **Szállítás**: GLS + Magyar Posta
- **Email**: Resend

## Fejlesztés Indítása

```bash
# Függőségek telepítése
npm install

# Fejlesztői szerver
npm run dev

# Build
npm run build

# Produkciós szerver
npm start
```

Az alkalmazás elindul: [http://localhost:3000](http://localhost:3000)

## Környezeti Változók

Másold le a `.env.local` fájlt és töltsd ki az API kulcsokat:

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase projekt URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key
- `STRIPE_SECRET_KEY` – Stripe titkos kulcs
- `OPENAI_API_KEY` – OpenAI API kulcs
- `BILLINGO_API_KEY` – Billingo API kulcs
- `RESEND_API_KEY` – Resend API kulcs

## Oldalak

| Útvonal | Leírás |
|---------|--------|
| `/` | Főoldal |
| `/termekek` | Terméklista |
| `/termekek/[slug]` | Termék részletek |
| `/kategoriak/[slug]` | Kategória oldal |
| `/kosar` | Bevásárlókosár |
| `/rendeles` | Checkout (3 lépéses) |
| `/blog` | Blog |
| `/rolunk` | Rólunk |
| `/bejelentkezes` | Bejelentkezés |
| `/regisztracio` | Regisztráció |
| `/fiokom` | Felhasználói fiók |
| `/admin` | Admin panel |

## API Végpontok

| Végpont | Leírás |
|---------|--------|
| `GET/POST /api/products` | Termékek |
| `GET /api/products/[slug]` | Termék részletek |
| `POST /api/orders` | Rendelés létrehozása |
| `POST /api/payments/stripe` | Fizetési szándék |
| `POST /api/shipping/gls` | GLS csomagfeladás |
| `POST /api/billing/billingo` | Billingo számla |
| `POST /api/ai/chatbot` | AI chatbot |
| `POST /api/ai/recommendations` | AI ajánlások |

## Docker

```bash
docker-compose up -d
```

## Projekt Struktúra

```
babyonline/
├── app/              # Next.js App Router oldalak
│   ├── (shop)/       # Publikus shop oldalak
│   ├── (auth)/       # Autentikációs oldalak
│   ├── (account)/    # Felhasználói fiók
│   ├── admin/        # Admin panel
│   └── api/          # API végpontok
├── components/       # React komponensek
│   ├── layout/       # Header, Footer, stb.
│   ├── shop/         # Termék, Kosár komponensek
│   ├── checkout/     # Checkout komponensek
│   ├── home/         # Főoldal szekciók
│   └── ai/           # AI chatbot
├── lib/              # Segédkönyvtárak
├── store/            # Zustand állapotkezelés
├── types/            # TypeScript típusok
└── prisma/           # Adatbázis séma
```
