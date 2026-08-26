# Sandbox Acceptance Guide

This guide defines the safe, repeatable acceptance environment for Quantava. It is intended for local development or an isolated staging database only. It must never be used to process customer funds or real identity documents.

## Safety boundary

The sandbox fixtures are enabled only when `SANDBOX_MODE=true` and `NODE_ENV` is not `production`. The backend seeder refuses to insert fixtures in a production environment. Sandbox KYC is also rejected by the verification endpoint unless the same non-production boundary is active.

Use a separate database, Redis namespace, exchange sandbox account, and wallet/testnet configuration. Do not point the sandbox at production RPCs, production exchange keys, production payment credentials, or real customer data.

## Start a local acceptance environment

Copy `.env.example` to `.env`, set `NODE_ENV=development`, configure a disposable MySQL/TiDB database and Redis instance, then set:

```dotenv
SANDBOX_MODE=true
NEXT_PUBLIC_DEMO_STATUS=true
NEXT_PUBLIC_DEFAULT_THEME=light
```

Run migrations and seeders:

```bash
pnpm install
pnpm migrate
SANDBOX_MODE=true NODE_ENV=development pnpm seed
pnpm dev
```

The seed command is idempotent for the fixed sandbox IDs and will create the demo records only in non-production mode.

## Test personas

| Persona | Login | Initial KYC state | Purpose |
|---|---|---|---|
| Sandbox trader | `sandbox.trader@example.com` / `Sandbox#2026!` | `APPROVED` | Test authenticated dashboard, balances, supported conversion, same-user wallet transfers, and trading UI in a disposable environment. |
| Sandbox recipient | `sandbox.recipient@example.com` / `Sandbox#2026!` | `PENDING` | Test recipient lookup, client-to-client transfer validation, pending KYC gating, and admin sandbox verification. |

The seeded trader has USD 10,000, EUR 5,000, USDT 2,500, and BTC 0.25 across FIAT and SPOT wallets. The recipient has USD 250 and USDT 10. These are database-only balances and have no chain or cash value.

## KYC test cases

The sandbox KYC level uses a deterministic provider with three decisions. The application data field `sandboxDecision` controls the outcome:

| Decision | Persisted provider result | Application status | Acceptance expectation |
|---|---|---|---|
| `PASS` | `VERIFIED` with score `0.99` | `APPROVED` | The user’s approved feature access and profile cache update are visible. |
| `FAIL` | `FAILED` with score `0.05` | `REJECTED` | The user cannot use approval-gated actions and receives a rejection state. |
| `PENDING` | `PENDING` with no score | `PENDING` | The user remains in review and no approval is granted. |

The seeded trader exercises the approved path. The seeded recipient exercises the pending path. To test rejection, create a disposable application in the sandbox database with `sandboxDecision=FAIL` and invoke the admin verification endpoint while authenticated as the seeded Super Admin.

## Wallet and conversion acceptance cases

The minimum acceptance run should verify that:

1. The trader can load FIAT and SPOT wallet balances from the disposable database.
2. A same-currency transfer uses a 1:1 rate and persists paired transaction records.
3. A supported USD-to-EUR conversion uses the sandbox rate table and never exceeds the source balance.
4. An unavailable or invalid rate produces no receive amount and blocks submission at both the UI and store boundary.
5. A client transfer rejects a malformed UUID, rejects self-transfer, resolves the recipient by the user primary key, and creates the recipient wallet only in the sandbox database.
6. A failed provider call, duplicate request, insufficient balance, and disabled wallet type produce an explicit error without debiting funds.
7. Every completed transfer can be reconciled by comparing source and destination wallet balances with the paired transaction records.

## What this does not prove

Sandbox acceptance proves deterministic application behavior, not the safety or availability of a production custodian, chain, exchange, fiat processor, identity vendor, or compliance program. Before mainnet, repeat the same scenarios against provider sandboxes and then run a controlled canary with real integrations, independent reconciliation, alerting, approvals, rollback, and legal/compliance sign-off.
