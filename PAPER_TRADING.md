# Hybrid Spot Trading

Quatava uses **paper trading by default**. Spot market, limit, and stop orders are simulated in the browser and stored locally under the `quatava.paper.spot.orders` key. Paper orders never call the live exchange order endpoint and never use real funds.

## Enabling live execution

Live execution is intentionally opt-in and requires both applications to be configured:

```text
Frontend: NEXT_PUBLIC_TRADING_MODE=LIVE
Backend:  TRADING_MODE=LIVE
```

Do not set either value to `LIVE` until the exchange credentials, database, authentication, risk controls, KYC/AML process, reconciliation, and sandbox tests have been completed. The backend remains paper-safe when `TRADING_MODE` is unset or has any value other than `LIVE`.

## Hostinger backend configuration

Deploy the backend application with:

```text
Root directory: backend
Build command: npm run build
Entry file: dist/index.js
Start command: npm run start
Node version: 22.x
```

Required database variables:

```text
NODE_ENV=production
DB_HOST=<Hostinger MySQL hostname>
DB_NAME=<database name>
DB_USER=<database user>
DB_PASSWORD=<database password>
DB_PORT=3306
REDIS_DISABLED=true
TRADING_MODE=PAPER
```

The frontend should point to the public backend application URL using `NEXT_PUBLIC_BACKEND_URL`. Never use `localhost` in a production deployment.

## Health checks

Before considering the product operational, verify:

```text
GET /api/settings                 → JSON, preferably with degraded=false
GET /api/exchange/market          → configured market data
GET /api/finance/wallet           → authenticated wallet response
POST /api/exchange/order           → blocked unless TRADING_MODE=LIVE
```

When the database or cache is unavailable, `/api/settings` returns a safe empty configuration payload with `degraded: true` rather than taking down the public frontend. Wallets and authenticated account data still require a healthy database and a valid authenticated session.
