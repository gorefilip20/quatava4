# Quatava

Quatava is a full-stack crypto finance platform designed around one clear operating principle: reduce the distance between market insight and execution. The product combines exchange markets, spot trading, perpetuals, wallet and finance operations, earn products, peer-to-peer trading, NFT infrastructure, token launches, referrals, and an administrative control plane in a single localized web application.

The public experience now uses a dark graphite trading-terminal direction with a neon green execution accent and restrained indigo signals. It is designed to feel calm during high-volatility moments: the landing page explains the platform, the market explorer exposes a usable snapshot even when the backend is offline, and live ticker services are adopted whenever the configured API and WebSocket services are available.

## Product surface

| Area | Product role | Primary route |
| --- | --- | --- |
| Public landing | Explains the product, trust model, liquidity, and core workflows | `/{locale}` |
| Market explorer | Searchable, filterable market surface with price, volume, momentum, and trend data | `/{locale}/market` |
| Trading terminal | Spot and advanced trading workflows | `/{locale}/trade` |
| Finance | Wallets, deposits, transfers, withdrawals, and transaction history | `/{locale}/finance/*` |
| Earn | Staking pools, positions, and reward history | `/{locale}/staking/*` |
| P2P | Offers, guided matching, trades, disputes, and payment methods | `/{locale}/p2p/*` |
| NFT and token launch | Marketplace, creator tooling, and ICO workflows | `/{locale}/nft/*`, `/{locale}/ico/*` |
| Operations | RBAC-protected system, finance, security, and content tooling | `/{locale}/admin/*` |

## Architecture

The repository is a workspace containing a Next.js 16 frontend and a TypeScript backend. The frontend uses the App Router, `next-intl`, Zustand stores, Tailwind CSS, Framer Motion, and shared WebSocket services. The backend exposes authenticated API handlers, Sequelize models, scheduled jobs, payment integrations, blockchain integrations, and WebSocket channels.

The frontend proxies `/api`, `/uploads`, and `/img/logo` to the backend during development. The public pages deliberately degrade to a deterministic market snapshot when the backend is unavailable; authenticated financial actions remain backend-dependent and must never be treated as successful without a confirmed API response.

## Local development

Install the workspace dependencies from the repository root:

```bash
pnpm install --no-frozen-lockfile
```

Start the frontend:

```bash
pnpm --filter frontend dev
```

Start the backend in a second terminal after creating a root `.env` from `.env.example` and configuring the database, Redis, payment providers, blockchain nodes, email, and authentication secrets:

```bash
pnpm --filter backend dev
```

The frontend is available at `http://localhost:3000`. When no locale is supplied, the middleware redirects to the configured default locale, which is `en` when no environment file is present.

## Verification

The production frontend build and backend TypeScript build are the minimum release gates:

```bash
NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter frontend build
pnpm --filter backend build
```

The frontend build is configured to preserve Next.js route compilation while the repository’s TypeScript check remains a separate diagnostic command:

```bash
NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter frontend type-check
```

The repository has a very large frontend graph. If the type-check exceeds the available Node heap, use the successful production build plus the backend build as the release baseline and investigate the compiler graph separately rather than disabling runtime validation.

## Production readiness notes

Quatava handles real financial workflows and should be deployed only after all provider credentials, database migrations, queue workers, blockchain RPC endpoints, and monitoring integrations are configured. The public landing and market explorer are safe to preview without a backend, but trading, custody, payments, KYC, withdrawals, and admin actions require a healthy backend and production secrets.

Before enabling real deposits or withdrawals, validate idempotency, webhook signatures, ledger reconciliation, hot-wallet controls, withdrawal approvals, rate limits, 2FA enforcement, KYC gating, and alert delivery in a staging environment. Use the deployment guide in [`DEPLOY.md`](./DEPLOY.md) for the current VPS setup flow and [`QUATAVA4_AUDIT_REPORT.md`](./QUATAVA4_AUDIT_REPORT.md) for the audit history and remaining release risks.

## Security boundary

Quatava is a technology platform, not financial advice. Market data can be delayed or indicative, and cryptocurrency products carry material risk. Never use fallback preview values as executable balances, positions, or settlement records.
