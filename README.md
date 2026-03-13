# VinDex

**Verified vehicle inspection reports — trusted, shareable, immutable.**

VinDex is a platform for independent vehicle inspectors to create structured inspection reports, digitally sign them, and share verified results via a public link. Buyers get trustworthy vehicle data; inspectors build a professional reputation backed by transparency.

## Why VinDex?

In used-vehicle markets, trust is the bottleneck. Sellers cherry-pick information, inspectors lack a professional digital presence, and buyers have no way to verify what they're told. VinDex solves this by giving inspectors a tool that produces **signed, immutable reports** anyone can verify — and by aggregating every inspection into a per-VIN timeline that builds trust over time.

## Key Features

- **Structured inspections** — Customizable templates with sections, checklist items, and free-text observations
- **Offline-first field mode** — Fill inspections on mobile with zero connectivity; data syncs when back online
- **Digital signing** — Lock inspections with a tamper-proof timestamp; signed reports cannot be modified
- **Shareable verified reports** — Each report gets a public URL with OG previews for WhatsApp, social media, and marketplaces
- **Vehicle timeline** — Every signed inspection for a VIN aggregated into a single public page
- **Inspector profiles** — Public page with stats, reviews, and inspection history
- **Post-purchase reviews** — Buyers rate whether the report matched the vehicle's real condition
- **PWA** — Installable on mobile, launches standalone, works offline

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Auth | Auth.js v5 (Credentials) |
| UI | shadcn/ui + Radix UI |
| Styling | Tailwind CSS 4 |
| Offline storage | Dexie.js (IndexedDB) |
| Image storage | Cloudinary |
| Hosting | Vercel |
| DB hosting | Neon |
| Analytics | PostHog |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)

### Setup

```bash
# Clone and install
git clone <repo-url>
cd vindex
npm install

# Start local PostgreSQL
cp .env.example .env
docker-compose up -d

# Create tables and seed data
npm run db:push
npm run db:seed

# Start dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Seed Data

The seed script creates:

- **Admin user** — `admin@vindex.app` / `admin123`
- **Demo inspector** — An active inspector node with a linked user
- **Starter template** — Standard inspection template with all default sections

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Drizzle schema to database |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |
| `npm run db:seed` | Seed database with initial data |
| `npm run test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
vindex/
├── specs/                  # Architecture, entity specs, flow specs, UI specs, mockups
├── src/
│   ├── app/                # Next.js App Router (pages and layouts)
│   ├── components/         # React components (ui, inspection, report, template, layout)
│   ├── lib/                # Business logic: services, server actions, validators, auth
│   ├── db/                 # Drizzle schema, migrations, seed script
│   ├── offline/            # Dexie DB, sync logic, photo queue, offline hooks
│   └── types/              # Shared TypeScript types
├── public/                 # Static assets, PWA manifest, service worker
└── docs/                   # Product documentation (PRD, one-pager, 90-day plan)
```

## Environment Variables

Copy `.env.example` and fill in the values:

```
DATABASE_URL=              # PostgreSQL connection string
AUTH_SECRET=               # Auth.js secret
AUTH_URL=                  # Base URL (http://localhost:3000 for dev)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NHTSA_API_URL=https://vpic.nhtsa.dot.gov/api/vehicles
POSTHOG_KEY=               # Optional in dev
POSTHOG_HOST=              # Optional in dev
```

## Deployment

The app deploys to **Vercel** with **Neon** as the database provider (auto-configured via the Vercel integration). Push to `main` triggers automatic deployment.

## Build Phases

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Scaffold — project setup, DB schema, auth, layout shells | Current |
| 1 | Template Management — inspector customizes inspection template | Planned |
| 2 | Inspection Creation — field mode, offline support, photo capture | Planned |
| 3 | Signing + Report — digital signing, public verified reports | Planned |
| 4 | Dashboard + Profile — inspector home screen, public profile | Planned |
| 5 | Vehicle Page + Reviews + Landing — VIN timeline, buyer reviews, landing page | Planned |

## License

Private — all rights reserved.
