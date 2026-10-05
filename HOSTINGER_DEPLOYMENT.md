# Hostinger Deployment Configuration

This guide is for the current Quatava repository. **Do not deploy real financial flows until the blockers in `SECURITY_AUDIT_PRELIVE.md` are closed.** The values below are names and safe placeholders only; generate and enter the real secrets in Hostinger's environment-variable panel, never in Git.

## Recommended topology

Use two Node.js applications if the Hostinger plan supports it:

| Component | Hostinger app | Public address | Internal listener |
|---|---|---|---|
| Next.js frontend | `app.example.com` | `https://app.example.com` | Hostinger-provided `PORT` |
| uWebSockets backend | `api.example.com` | `https://api.example.com` | Hostinger-provided `PORT` |

If only one Node application is available, use a reverse proxy/process manager that routes the frontend and API to two local listeners. Do not expose fixed ports 3000/4000 directly to the Internet and do not rely on the repository PM2 file's hard-coded ports in a managed Hostinger Node application.

## Runtime and build settings

### Common settings

- **Node.js:** 22 LTS (the repository has already been validated on Node 22).
- **Package manager:** pnpm 11.25.0. Use Corepack or install the exact version before installing dependencies.
- **Repository root:** the checkout root containing `package.json`, `frontend/`, and `backend/`.
- **Install command:**

```bash
corepack enable && corepack prepare pnpm@11.25.0 --activate && pnpm install --frozen-lockfile
```

- **Build command:**

```bash
pnpm build:all
```

This builds the Next.js frontend and TypeScript backend. Run it only after all build-time `NEXT_PUBLIC_*` values have been configured.

- **Database migration command, once per release before starting the backend:**

```bash
pnpm --filter backend migrate
```

Back up PostgreSQL first. Review migrations before applying them. The backend currently also calls Sequelize sync during startup, so production schema management should be tested carefully before enabling automatic restarts.

### Frontend application

- **Working directory:** repository root or `frontend/`, depending on Hostinger's panel.
- **Build command:** `pnpm --filter frontend build`
- **Startup command:** `node frontend/server.js`
- **Working directory for startup:** repository root.
- **Port:** Hostinger's injected `$PORT`; do not force 3000.
- **Required build-time public variables:** `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_DESCRIPTION`, `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` if wallet connection is enabled.

### Backend application

- **Working directory:** repository root.
- **Build command:** `pnpm --filter backend build`
- **Startup command:** `node backend/dist/index.js`
- **Port:** Hostinger's injected `$PORT`; the entrypoint already prefers `PORT`.
- **Required runtime variables:** database, Redis, token secrets, site/backend URLs, and rate-limit settings listed below.
- **Health check:** `GET /api/health` after the process starts. Restrict detailed admin health endpoints to administrators/private networking.

## Generate secrets

Generate four independent 64-byte secrets on a trusted machine:

```bash
openssl rand -hex 64
openssl rand -hex 64
openssl rand -hex 64
openssl rand -hex 64
```

Use one output for each of:

- `APP_ACCESS_TOKEN_SECRET`
- `APP_REFRESH_TOKEN_SECRET`
- `APP_RESET_TOKEN_SECRET`
- `APP_VERIFY_TOKEN_SECRET`

Never reuse a database password, provider key, wallet private key, or another application's secret. If any existing value from `.env.example` has been used, rotate it before deployment.

## Minimum backend environment variables

Set these in the **backend app only**, unless marked public:

```dotenv
NODE_ENV=production
PORT=<Hostinger-provided-port>

# Public URL/CORS identity
NEXT_PUBLIC_SITE_URL=https://app.example.com
NEXT_PUBLIC_BACKEND_URL=https://api.example.com
BACKEND_URL=https://api.example.com
FRONTEND_URL=https://app.example.com
NEXT_PUBLIC_SITE_NAME=Quatava
NEXT_PUBLIC_SITE_DESCRIPTION=Quatava cryptocurrency platform

# Database: prefer one DATABASE_URL, not both URL and discrete credentials
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require
PGSSLMODE=require
DB_SSL=true
DB_CONNECT_TIMEOUT_MS=10000
DB_POOL_MAX=10
DB_POOL_ACQUIRE_MS=30000
DB_POOL_IDLE_MS=10000
PG_APPLICATION_NAME=quatava-production

# Redis is required for sessions, refresh tokens, and rate limiting
REDIS_HOST=<private-redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<strong-redis-password>
REDIS_DB=0
REDIS_DISABLED=false

# Independent random secrets; never use the example values
APP_ACCESS_TOKEN_SECRET=<64-byte-hex-secret>
APP_REFRESH_TOKEN_SECRET=<64-byte-hex-secret>
APP_RESET_TOKEN_SECRET=<64-byte-hex-secret>
APP_VERIFY_TOKEN_SECRET=<64-byte-hex-secret>
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=14d
JWT_RESET_EXPIRY=1h

# Browser/API policy
APP_CLIENT_PLATFORM=browser
RATE_LIMIT=100
RATE_LIMIT_EXPIRE=60
SANDBOX_MODE=false
NEXT_PUBLIC_DEMO_STATUS=false
NEXT_PUBLIC_MAINTENANCE_STATUS=false
```

**Important:** the code reads `RATE_LIMIT_EXPIRE`; the similarly named `RATE_LIMIT_EXPIRY` in the example file is not the setting used by the middleware.

## Minimum frontend build-time environment variables

These are safe to expose only because they are intended to be public configuration. They are embedded into the browser bundle at build time:

```dotenv
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://app.example.com
NEXT_PUBLIC_BACKEND_URL=https://api.example.com
NEXT_PUBLIC_SITE_NAME=Quatava
NEXT_PUBLIC_SITE_DESCRIPTION=Quatava cryptocurrency platform
NEXT_PUBLIC_FRONTEND_PORT=3000
NEXT_PUBLIC_BACKEND_PORT=4000
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
NEXT_PUBLIC_DEFAULT_THEME=light
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<public-walletconnect-project-id>
NEXT_PUBLIC_GOOGLE_AUTH_STATUS=false
NEXT_PUBLIC_GOOGLE_RECAPTCHA_STATUS=false
NEXT_PUBLIC_VERIFY_EMAIL_STATUS=true
NEXT_PUBLIC_2FA_STATUS=true
NEXT_PUBLIC_2FA_APP_STATUS=true
NEXT_PUBLIC_2FA_EMAIL_STATUS=false
NEXT_PUBLIC_2FA_SMS_STATUS=false
```

Do **not** put any database password, JWT secret, SMTP password, payment secret, exchange secret, AI key, RPC private key, KYC private key, or webhook secret in a `NEXT_PUBLIC_*` variable. In particular, rename/remove `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SECRET_KEY`; a reCAPTCHA secret must be server-only.

## Optional provider variables

Only set the block for a provider that has been approved, configured, and tested. Do not populate every variable with dummy values.

### Email/password reset/verification

```dotenv
APP_EMAILER=nodemailer-smtp
APP_EMAIL_SENDER_NAME=Quatava
APP_NODEMAILER_SMTP_HOST=<smtp-host>
APP_NODEMAILER_SMTP_PORT=587
APP_NODEMAILER_SMTP_ENCRYPTION=tls
APP_NODEMAILER_SMTP_SENDER=support@example.com
APP_NODEMAILER_SMTP_PASSWORD=<smtp-password>
```

Use an SMTP/app password, not a personal mailbox password. Configure SPF, DKIM, and DMARC.

### Stripe

```dotenv
APP_STRIPE_SECRET_KEY=sk_live_<real-secret>
# Frontend only, if used by the browser:
# NEXT_PUBLIC_APP_STRIPE_PUBLIC_KEY=pk_live_<public-key>
```

Configure the provider webhook to the exact production API endpoint and verify signature/replay behavior before enabling credits.

### Other payment providers

The backend contains provider-specific routes. Set only the selected provider's server-side credentials, callback URLs, sandbox flag, and webhook endpoint/secret. Examples include:

```dotenv
APP_PAYPAL_CLIENT_SECRET=<secret>
NEXT_PUBLIC_APP_PAYPAL_CLIENT_ID=<public-client-id>
APP_PAYSTACK_SECRET_KEY=<secret>
APP_ADYEN_API_KEY=<secret>
APP_ADYEN_HMAC_KEY=<secret>
APP_MOLLIE_API_KEY=<secret>
APP_PAYFAST_MERCHANT_KEY=<secret>
APP_PAYFAST_PASSPHRASE=<secret>
```

The exact variable set must match the provider route and its production documentation. Keep sandbox flags off only after signature and amount/currency reconciliation tests pass.

### KYC provider

```dotenv
SUMSUB_ENV=production
SUMSUB_API_KEY=<server-secret>
SUMSUB_API_SECRET=<server-secret>
SUMSUB_WEBHOOK_SECRET=<server-secret>
SUMSUB_PUBLIC_KEY=<public-key-if-required>
```

KYC files must be private before production use; see the audit report.

### Fiat rates and AI

```dotenv
APP_FIAT_RATES_PROVIDER=openexchangerates
APP_OPENEXCHANGERATES_APP_ID=<server-key>
OPENAI_API_KEY=<server-key>
DEEPSEEK_API_KEY=<server-key>
GEMINI_API_KEY=<server-key>
```

Set only the services actually enabled. Apply provider spending limits.

### Exchange and blockchain RPCs

Set only networks and providers you actually operate:

```dotenv
NEXT_PUBLIC_EXCHANGE=bin
APP_BINANCE_API_KEY=<restricted-key>
APP_BINANCE_API_SECRET=<secret>
ETH_NETWORK=mainnet
ETH_MAINNET_RPC=https://<authenticated-rpc-endpoint>
BSC_NETWORK=mainnet
BSC_MAINNET_RPC=https://<authenticated-rpc-endpoint>
TRON_NETWORK=mainnet
TRON_MAINNET_RPC=https://<authenticated-rpc-endpoint>
SOLANA_NETWORK=mainnet
SOLANA_RPC_URL=https://<authenticated-rpc-endpoint>
NEXT_PUBLIC_IPFS_GATEWAY=https://<approved-gateway>
```

Exchange keys must have withdrawals disabled unless a reviewed operational process requires otherwise. Do not put blockchain private keys in the frontend environment. Treat `PRIVATE_KEY`, `ENCRYPTION_KEY_PASSPHRASE`, and custody-wallet credentials as HSM/secret-manager material, not ordinary app configuration.

### Settlement/remittance

Keep this in preview until the legal/provider controls are complete:

```dotenv
QUATAVA_SETTLEMENT_PROVIDER=preview
QUATAVA_SETTLEMENT_PROVIDER_URL=
QUATAVA_SETTLEMENT_API_KEY=
QUATAVA_SETTLEMENT_WEBHOOK_SECRET=
```

For production, use a regulated provider, a random webhook secret, exact raw-body signature verification, timestamp/replay protection, and idempotent provider event storage.

## Hostinger launch sequence

1. Create PostgreSQL and Redis services/private endpoints.
2. Create two Node applications (frontend and backend) or configure a reverse proxy for two local listeners.
3. Configure environment variables in Hostinger's secret/environment panel; do not upload `.env` to Git or public web root.
4. Set Node 22 and install pnpm 11.25.0.
5. Run `pnpm install --frozen-lockfile`.
6. Run database backups and `pnpm --filter backend migrate`.
7. Build with `pnpm build:all`.
8. Start backend and frontend using Hostinger's `$PORT`.
9. Confirm HTTPS, cookie flags, CORS origins, websocket behavior, `/api/health`, email delivery, and error logging.
10. Run staging deposits, webhook retries, duplicate requests, card funding/unloading, withdrawals, file uploads, and auth/CSRF tests with non-production funds.
11. Enable real financial providers only after the security audit blockers are closed and monitoring/incident response are active.

## Do not use in production

- The example token values or license key.
- `SANDBOX_MODE=true`, demo mode, provider sandbox credentials, or testnet RPCs.
- HTTP site/backend URLs.
- Public KYC file URLs.
- The legacy `proxy.sol` contract.
- Unrestricted API documentation/admin endpoints without access controls.
- Hard-coded ports from `production.config.js` when Hostinger injects `PORT`.
