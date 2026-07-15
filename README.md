# Quatava

Quatava is a cryptocurrency exchange platform where users can trade Bitcoin, Ethereum, Litecoin, and other cryptocurrencies. It supports KYC verification, fiat on/off-ramps, exchange connectivity, and multi-chain wallet support.

## Monorepo layout

This is a pnpm workspace with two packages:

- **`frontend/`** — Next.js (App Router, locale-based routing under `app/[locale]/`), Tailwind CSS, Web3 wallet integration (Reown AppKit/Wagmi).
- **`backend/`** — Node.js/TypeScript API on a custom uWebSockets-based server (`src/server.ts`), Sequelize ORM over MySQL/MariaDB, Redis-backed job queues, and multi-chain blockchain integrations under `src/blockchains/`.

Other top-level directories: `docs/` (static docs site), `scripts/` (ops scripts, e.g. Bitcoin node setup), `tools/` (translation sync, permission extraction, package update utilities).

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in DB, Redis, and provider credentials
pnpm dev                # runs frontend + backend concurrently
```

Individual packages: `pnpm dev:frontend`, `pnpm dev:backend`.

Database: `pnpm --filter backend migrate` then `pnpm seed`.

## Testing & linting

```bash
pnpm test        # backend Jest suite
pnpm lint        # frontend ESLint
pnpm format      # Prettier
```

## Deployment

**Canonical path:** manual Ubuntu VPS deployment — see [`DEPLOY.md`](./DEPLOY.md) (Nginx + PM2 + MariaDB + Redis).

`apphosting.yaml` / `firebase.json` / `.firebaserc` are unconfigured Firebase App Hosting scaffolding retained for a possible future Cloud Run deployment target; they are not currently used and have no live deployment behind them. Don't treat them as an alternate source of truth for how this app is deployed.
