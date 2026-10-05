# Quatava Pre-Live Security Audit

**Audit date:** 2026-10-05  
**Scope:** Solidity contracts under `backend/ecosystem/smart-contracts`, backend APIs/authentication/webhooks/uploads, dependency graph, and production runtime configuration.  
**Assessment:** **Not approved for live financial deployment.** Several critical/high findings must be remediated and independently retested first.

## Executive summary

The codebase builds, but the audit identified material risks in both the smart-contract and backend layers:

- A legacy `Proxy` contract allows **any externally owned account to replace the implementation**.
- CSRF validation is effectively enabled only for `/logout`; most cookie-authenticated state-changing APIs are not protected.
- KYC documents are written under a publicly served `/uploads/` tree and are returned as public URLs.
- The production dependency graph contains critical/high advisories, including the pinned Next.js, Swiper, Sharp, Axios/TronWeb, `xlsx`, `adm-zip`, and Nodemailer paths.
- The NFT package does not declare `@openzeppelin/contracts-upgradeable`, so its clean build is not reproducible from its manifest.
- Smart-contract compilation succeeds only after temporarily adding that missing dependency; the Hardhat test suite reports **0 tests**.
- Example configuration contains secret-like token values and a license key. Treat all non-placeholder values in tracked examples as exposed and rotate them if they have ever been used.

No evidence of a production private key was found by the pattern scan, but that is not proof that credentials are safe. Rotate any key that has appeared in the repository, shell history, CI logs, or shared artifacts.

## Findings

### C-01 — Unrestricted legacy proxy upgrade — **Critical**

**Evidence:** `backend/ecosystem/smart-contracts/proxy/proxy.sol:11-14`

```solidity
function upgradeTo(address _newImplementation) external {
  require(msg.sender == tx.origin, 'Proxy: Only EOAs can upgrade');
  implementation = _newImplementation;
}
```

Any EOA can call `upgradeTo` and point the proxy at attacker-controlled code. `tx.origin` is not an authorization mechanism and is an anti-pattern. If this proxy is deployed or holds assets, an attacker can replace the implementation and drain or lock funds.

**Required action:** Do not deploy this contract. If already deployed, treat it as compromised until asset exposure is assessed. Replace it with OpenZeppelin Transparent/UUPS proxy infrastructure with an explicit multisig/timelock-controlled upgrade authority, or permanently disable upgrades after an audited deployment.

### C-02 — Missing CSRF protection on most state-changing routes — **High/Critical**

**Evidence:** `backend/src/handler/Middleware.ts:266-305`

The check returns immediately when the method is GET **or when the URL is not in** `AUTH_PAGES`. `AUTH_PAGES` currently contains only `/logout`. Therefore authenticated POST/PUT/PATCH/DELETE routes using cookies, including financial operations, do not receive the intended CSRF check.

**Required action:** Apply CSRF validation to every cookie-authenticated state-changing route, or use a strict bearer-token-only API architecture for those routes. Keep API-key/plugin routes separate. Add integration tests proving CSRF rejection for Buy Crypto, card funding, transfers, withdrawals, profile changes, and admin mutations.

### C-03 — Public exposure of KYC documents — **High**

**Evidence:** `backend/src/api/upload/kyc-document.post.ts`; `backend/src/server.ts` upload static handling; `backend/src/api/upload/index.post.ts`

KYC files are stored under the frontend public uploads directory and returned as `/uploads/...` URLs. The server serves `/uploads/` as static content before normal routing. KYC identity documents should not be public or guessable. The generic upload endpoint also accepts a caller-selected directory and `oldPath`; ownership is not bound to a user-specific server-side path.

**Required action:** Store KYC documents in private object storage or a non-public directory. Serve them through an authenticated, authorization-checked download endpoint with short-lived signed URLs. Bind upload/delete paths to the authenticated user/KYC application on the server. Add antivirus/content scanning and strict quotas.

### C-04 — Production dependency vulnerabilities — **High/Critical**

`npm audit --omit=dev` reported:

- Frontend: **2 critical, 11 high, 13 moderate, 5 low**
- Backend: **34 high, 21 moderate, 1 low**

Important direct/runtime-relevant paths include:

- `next@16.2.4`: advisories require upgrading to the patched release line; do not launch with the current pinned version.
- `swiper@11.2.10`: critical prototype-pollution advisory; upgrade to a patched release or remove it.
- `sharp@0.33.5`: high advisories in inherited image libraries; upgrade to a patched release and rebuild native binaries.
- `xlsx@0.18.5`: high prototype-pollution/ReDoS advisories; upgrade to a patched release or remove server-side parsing of untrusted workbooks.
- `adm-zip@0.5.17`: high decompression-bomb and archive extraction advisories; upgrade/remove and never extract untrusted archives without limits.
- `nodemailer@6.10.1`: multiple advisories; upgrade to a patched release before enabling production email flows.
- `tronweb` inherits vulnerable Axios paths; upgrade TronWeb/Axios together and review all outbound URL handling.
- `ip@2.0.1`, `csv-parse`, `tonweb`, `bull`, Sequelize transitive paths, and mobile/Expo packages also require dependency review.

**Required action:** upgrade direct dependencies, regenerate the lockfile with one package manager, rerun production-only audits, and fail CI on critical/high runtime vulnerabilities unless there is a documented, reviewed exception.

### H-01 — Upgrade authority is not protected by a timelock/multisig — **High**

**Evidence:** `NFTMarketplaceV3.sol:_authorizeUpgrade`, `MultiSigWallet.sol:_authorizeUpgrade`

The marketplace UUPS upgrade is controlled by `UPGRADER_ROLE`/`DEFAULT_ADMIN_ROLE`; initialization grants powerful roles to the initializer. The upgrade path is not itself subject to a timelock or independent multisig policy. A compromised deployer/admin can replace marketplace logic.

**Required action:** use a dedicated multisig as the sole upgrade authority, enforce an on-chain timelock for upgrades, publish implementation hashes, and test upgrade storage compatibility. Do not grant deployer EOAs permanent admin/upgrader roles.

### H-02 — Custodial wallet has a single master authority — **High**

**Evidence:** `CustodialWalletERC20.sol:31-49,78-122`

All transfers and master-wallet changes are controlled by one `masterWallet`. The `implementation` variable is not an actual upgrade mechanism. A compromised master key can move all assets.

**Required action:** move custody controls behind a production multisig/HSM policy, separate hot-wallet limits from treasury custody, add withdrawal allowlists/daily limits, and implement monitoring plus emergency pause procedures.

### H-03 — Webhook verification/replay controls need provider-by-provider hardening — **High**

**Evidence:** `backend/src/api/remittance/webhook.post.ts`; `backend/src/utils/remittance.ts`; provider webhook routes under `backend/src/api/finance/deposit/fiat/**/webhook.post.ts`

The remittance handler reconstructs the body using `JSON.stringify(data.body)` instead of verifying the provider's exact raw request bytes. It has no timestamp/nonce replay window. Reconciliation is idempotent for terminal statuses, but every provider route must independently verify its provider signature, event ID, amount, currency, merchant/account binding, and replay status before crediting funds.

**Required action:** capture raw request bytes, verify the exact provider signature, reject stale timestamps, store unique provider event IDs, lock the ledger row, compare amount/currency/order identity, and make provider webhook processing idempotent.

### H-04 — Upload parsing permits memory/CPU denial of service — **High**

**Evidence:** `backend/src/api/upload/index.post.ts`; `backend/src/api/upload/kyc-document.post.ts`

Large base64 request bodies are parsed into memory before the application checks the decoded size. Image transformation uses Sharp; KYC accepts ZIP-based Office formats without archive limits or malware scanning. Public static serving compounds the impact.

**Required action:** enforce reverse-proxy and parser body limits before buffering, use streaming multipart uploads, validate decoded size and dimensions, cap Sharp work, reject archive formats unless required, scan uploads, and isolate storage.

### M-01 — Production CORS list includes HTTP variants — **Medium**

**Evidence:** `backend/src/utils/index.ts:41-75`

Production origin generation adds HTTP variants of the configured HTTPS site and allows credentials. Secure cookies reduce some exposure, but production should not permit credentialed HTTP origins.

**Required action:** allow only explicit HTTPS origins in production, set `Vary: Origin`, and remove localhost/default origins from production configuration.

### M-02 — Security headers are incomplete — **Medium**

The response helper sets limited headers but does not establish a strict CSP, HSTS, `X-Frame-Options`/`frame-ancestors`, or a deliberate permissions policy. Add these at the reverse proxy or application layer after testing wallet/payment compatibility.

### M-03 — Example configuration contains exposed-looking secrets — **High operational risk**

`.env.example` contains non-placeholder-looking token secret/license values and includes a `NEXT_PUBLIC_*` name for a reCAPTCHA secret. Anything prefixed `NEXT_PUBLIC_` can be bundled into browser code when referenced.

**Required action:** replace all example secret values with obvious placeholders, rename server-only secrets without `NEXT_PUBLIC_`, rotate any value previously used, and enforce secret scanning in CI.

### M-04 — Rate-limit fail-open/coverage gaps — **Medium**

The general rate limiter depends on Redis and is applied only after `requiresAuth`; unauthenticated webhook/public routes are not necessarily protected by the same limiter. Failure handling returns 500 rather than a controlled fail-closed policy. Sensitive operations need endpoint-specific limits, account/device dimensions, and abuse monitoring.

### M-05 — MultiSig cancellation threshold is weaker than the execution threshold — **Medium**

**Evidence:** `MultiSigWallet.sol:217-224`

Cancellation requires `confirmations >= signers.length / 2`, not `requiredConfirmations`. For a 2-of-3 wallet, one confirmation can cancel a transaction. This may be intentional, but it is a governance footgun and can suppress approved operations.

**Required action:** define cancellation policy explicitly and test it; normally require the configured threshold or a separately documented emergency threshold.

### M-06 — Meta-transaction implementation appears functionally incorrect — **Medium functional/security risk**

**Evidence:** `backend/ecosystem/smart-contracts/gsn/MetaTransaction.sol:48-61`

The contract calls `token.approve(address(this), value)` from the relayer contract, which approves the contract's own token balance rather than creating an allowance from `owner`. The subsequent `transferFrom(owner, ...)` will not work for normal ERC-20 tokens. Do not deploy or rely on this path until redesigned around EIP-2612 permit or a correctly audited transfer-authorized flow.

### M-07 — Reproducible contract build is incomplete

`backend/ecosystem/smart-contracts/nft/package.json` does not declare `@openzeppelin/contracts-upgradeable`, although contracts import it. Compilation succeeded only after adding that package temporarily. Add and pin the dependency, commit a lockfile, and add real unit/invariant tests. The current Hardhat test run reports **0 passing tests**.

## Positive controls observed

- Password hashing uses Argon2.
- JWT signing uses separate access/refresh/reset/verification secrets.
- Financial Buy Crypto/Card Funding changes added idempotency keys and database locking in the recent release.
- Remittance reconciliation uses a database transaction and row locks and avoids refunding already terminal completed/refunded rows.
- Contract marketplace buy/list/cancel paths use reentrancy guards.
- Upload paths perform traversal checks and several magic-number checks, although the storage/public-access and resource-limit model remains unsafe.
- Solidity compilation succeeded for the audited Hardhat project after supplying the missing upgradeable OpenZeppelin dependency.

## Required go-live gate

Do not enable real deposits, withdrawals, card funding, remittance settlement, or custodial wallet transfers until C-01 through C-04 and H-01 through H-04 are closed, dependency audits are clean or formally excepted, provider webhook replay tests pass, and an independent smart-contract review covers every deployed address and upgrade/admin key.

## Re-test commands

```bash
# Application builds/tests
pnpm install --frozen-lockfile
pnpm --filter backend build
pnpm --filter backend exec jest --config jest.config.js --runInBand
NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter frontend build

# Runtime dependency audits
npm audit --omit=dev
pnpm audit --prod

# Contracts, from backend/ecosystem/smart-contracts/nft
npm install --ignore-scripts
npx hardhat compile
npx hardhat test
```

The last contract command is not a substitute for Slither/Mythril/Echidna and an independent manual review.
