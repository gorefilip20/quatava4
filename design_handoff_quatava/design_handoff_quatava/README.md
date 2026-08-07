# Handoff: Quatava Cryptocurrency Platform — Full Redesign

## Overview
Quatava is a cryptocurrency platform with instant crypto-to-fiat conversion, spot trading, wallet management, staking, NFT marketplace, and AI investment features. This handoff covers the complete UI redesign — 6 screens covering landing page, user dashboard, spot trading, wallet/portfolio, instant convert (replaces P2P), and mobile app views.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look, layout, and behavior. They are NOT production code. Your task is to **recreate these designs in the actual codebase** (the quatava4 GitHub repo at github.com/gorefilip20/quatava4) using whatever framework the project uses, or choose the best framework if starting fresh. Match the visual design pixel-perfectly.

## Fidelity
These are **high-fidelity** mockups with final colors, typography, spacing, and interaction states. Recreate the UI as closely as possible.

---

## CRITICAL CHANGE: P2P Removed → Convert Replaces It

**Remove all P2P Exchange functionality entirely.** Replace it with the new **Convert** feature throughout the entire codebase:

- **What Convert does:** Users convert crypto assets (BTC, ETH, SOL, USDT, XRP) instantly to local fiat currencies (NGN, USD, EUR, GBP, MXN, AED) at live market rates. No middlemen, no escrow, no peer-to-peer matching — fully automated instant conversion.
- **Navigation:** Every sidebar, nav bar, bottom tab, and menu that previously said "P2P" or "P2P Exchange" must now say "Convert" with a swap-arrows icon.
- **Convert page tabs:** Convert | Buy Crypto | Send | Withdraw to Bank
- **Bank details:** Auto-detect user's country and fetch appropriate bank list (Nigeria: Access Bank, GTBank, First Bank, UBA, Zenith, Kuda, OPay; UK: Barclays, HSBC, Lloyds, etc.; similar for other regions).
- **After conversion:** Converted fiat appears on the Dashboard reflecting the user's local currency, where they can withdraw to their bank.

---

## Screens / Views

### 1. Landing Page (`Quatava Landing.dc.html`)
**Purpose:** Public-facing marketing page to attract new users.

**Layout:**
- Full-width, max-content 1200px centered
- Sections separated by 2px horizontal rules

**Sections in order:**
1. **Nav bar** — Q monogram logo (blue square, white "Q"), "Quatava" wordmark, nav links (Markets, Features, How It Works, Convert, Mobile), theme toggle (sun/moon), Log In button (secondary), Get Started button (primary)
2. **Hero** — Left-aligned display heading "Trade smarter. / Earn more." (accent color on "Earn more."), subtitle paragraph, two CTAs (Start Trading primary, Explore Markets ghost)
3. **Stats row** — 4-column grid: $2.4B daily volume, 3.2M active traders, 180+ assets, 99.9% uptime
4. **Live Markets** — Table with 5 rows (BTC, ETH, SOL, XRP, TON) showing pair icon, price, 24h change (green/red), volume
5. **Features grid** — 3-column grid, 6 cards: Spot Trading, Futures & Margins, Instant Convert, Staking & Earn, NFT Marketplace, AI Investment — each with icon, title, description
6. **How It Works** — 4-step numbered cards (01–04): Create account, Verify identity, Deposit funds, Start trading
7. **Mobile app preview** — 2-column: left copy + download buttons, right phone mockup showing balance card and asset list
8. **Trust & Security** — 3 cards: Multi-layer encryption, 2FA & biometric, Real-time monitoring
9. **CTA banner** — Full-width blue background: "Your money. / Your markets. / Your rules." with ghost CTA
10. **Footer** — 4-column: brand + tagline, Products links, Company links, Support links, bottom bar with copyright + legal links

### 2. User Dashboard (`Quatava Dashboard.dc.html`)
**Purpose:** Logged-in user's home — portfolio overview, quick actions, recent activity.

**Layout:** 220px sidebar + fluid main content

**Sidebar navigation (consistent across all logged-in screens):**
- Main: Dashboard, Wallet
- Trading: Spot Trading, Futures, Convert ← (NOT P2P)
- Invest: Staking, NFT Marketplace, AI Investment
- Account: Settings, Log Out

**Main content:**
1. **Balance card** — Blue gradient (135deg, #3375BB → #1E4A7A), white text: "Total Portfolio Value" label, $124,831.40 large heading, +$4,231.80 (3.5%) change in green, Deposit + Withdraw buttons
2. **Quick actions** — 4-column grid: Trade, Swap, Stake, Convert ← (NOT P2P Buy)
3. **Portfolio chart + Watchlist** — 2:1 grid. Left: line chart with gradient fill, time range buttons (24H/7D/1M/1Y). Right: watchlist with 6 pairs and prices
4. **Assets + Recent Activity** — 2:1 grid. Left: table (Asset/Balance/Value/24h) with 4 rows. Right: transaction list (Deposit, Swap, Withdrawal, Staking Reward)

### 3. Spot Trading (`Quatava Trading.dc.html`)
**Purpose:** Professional trading interface with chart, order book, and order entry.

**Layout:** 3-column grid (240px market list | fluid chart | 320px order panel), full viewport height

**Top nav:** Q logo, links (Spot active, Futures, Convert, Staking), theme toggle, notifications, avatar

**Pair header bar:** BTC/USDT selector, price ($67,842.50 green), 24h change, high, low, volume

**Columns:**
1. **Market list (left)** — Search input, scrollable list of 11 pairs with price and 24h change, active highlight on BTC/USDT
2. **Chart area (center)** — Tab bar (Chart/Depth/Info + timeframes 1m/5m/1H/4H/1D), SVG line chart with gradient fill and volume bars, split bottom: Order Book (asks red, bids green, spread indicator) + Recent Trades (price/amount/time)
3. **Order panel (right)** — Buy/Sell tabs (green/red), Limit/Market/Stop segmented control, Price input, Amount input, percentage buttons (25/50/75/100%), Total input, Available balance, Fee display, Buy BTC button (green), Open Orders section (2 sample orders with cancel buttons)

### 4. Wallet / Portfolio (`Quatava Wallet.dc.html`)
**Purpose:** Full asset management — balances, allocation, transactions.

**Layout:** 220px sidebar + fluid main

**Content:**
1. **3-column stats** — Total Balance ($124,831.40 +3.5%), Available Balance ($98,420.60), Staking Rewards MTD (+$342.18, APY 8.2%)
2. **4 action cards** — Deposit, Withdraw, Transfer, Stake — each with icon, label, description
3. **Tabs** — Assets | Allocation | Transactions
4. **Assets table** — 6-column (Asset/Balance/Value/Price/24h/Actions) with 5 rows, Trade + Send buttons per row
5. **Bottom 2-column:** Allocation donut chart (BTC 61%, ETH 12%, SOL 8%, USDT 6%, Others 13%) | Recent Transactions with type badges (Deposit green, Swap blue, Withdraw red, Stake purple) and status pills

### 5. Convert (`Quatava Convert.dc.html`) — THE NEW PAGE REPLACING P2P
**Purpose:** Instant crypto-to-fiat conversion, buy crypto, send crypto, withdraw to bank.

**Layout:** 220px sidebar + fluid main with 2-column content (form | rates sidebar 360px)

**Tabs:** Convert | Buy Crypto | Send | Withdraw to Bank

**Convert form (main column):**
1. **Country auto-detect banner** — Globe icon, "Detected region: Nigeria — Showing NGN rates. Change →"
2. **Conversion card:**
   - "You send" — amount input + crypto selector dropdown (BTC, ETH, SOL, USDT, XRP)
   - Swap button (rotates 180° on hover)
   - "You receive" — calculated amount (readonly) + fiat selector (NGN, USD, EUR, GBP, MXN, AED)
   - Rate bar — "1 BTC = ₦104,630,975.00", "Updated 3s ago · Refreshes in 27s"
   - Fee breakdown: network fee, platform fee (0.1%), final receive amount
   - Green "Convert 1.0 BTC → NGN" button
3. **Payment method cards** — 3-column: Bank Account (selected, instant, free), Mobile Money (~2 min), Quatava Wallet (instant)
4. **Bank details form** — Auto-detected country flag, Bank Name dropdown (country-specific list), Account Number, Account Name (readonly, auto-fetched), security note

**Rates sidebar (right column):**
1. **Live Rates (NGN)** — BTC/NGN, ETH/NGN, USDT/NGN, SOL/NGN with prices and 24h change
2. **Other Currencies** — USD, GBP, EUR, MXN, AED rates for 1 BTC
3. **Why Convert?** — 4 benefit checkmarks: no middlemen, direct to bank, no scam risk, 6+ currencies

**Recent Conversions table:** Type badge (Convert/Buy/Send), description, destination, date, status

**BACKEND REQUIREMENTS FOR CONVERT:**
- Integrate a live crypto price API (CoinGecko, CoinMarketCap, or Binance API)
- Integrate fiat exchange rate API (exchangerate-api.com or similar)
- Calculate conversion: crypto amount × crypto-USD price × USD-to-fiat rate
- Rate refresh every 30 seconds with countdown timer
- Fee calculation: network fee (configurable per crypto) + platform fee (0.1%)
- Country detection via IP geolocation (ipapi.co or similar)
- Bank list per country (store in database, start with Nigeria, US, UK, EU, Mexico, UAE)
- Account name verification via bank API (for Nigeria: use Paystack/Flutterwave verify endpoint)
- Conversion execution: deduct crypto from user wallet, credit fiat to bank via payment processor
- Transaction history with status tracking (pending → processing → completed/failed)

### 6. Mobile App Screens (`Quatava Mobile.dc.html`)
**Purpose:** Visual reference for the mobile app (iOS/Android) — 3 phone mockups side by side.

**Screen 1 — Home (Dark Mode, 375×812):**
- Status bar, greeting "Welcome back", user name "John D."
- Blue gradient balance card ($124,831.40, +$4,231.80)
- 4 action buttons: Deposit, Send, Swap, Stake
- Assets list: BTC, ETH, SOL, USDT with balances and 24h change
- Bottom nav: Home (active), Trade, Convert, Wallet, More

**Screen 2 — Trade (Light Mode):**
- Pair bar: BTC/USDT, price $67,842.50
- Mini line chart with gradient
- Buy/Sell toggle (Buy active, green)
- Order form: Price, Amount, percentage chips, Available balance, Buy BTC button
- Same bottom nav with Trade active

**Screen 3 — Convert (Dark Mode):**
- Crypto selector chips (BTC active, ETH, USDT, SOL)
- "You send" input (1.0000 BTC)
- Swap icon
- "You receive" input (104,630,975 NGN)
- Rate display (1 BTC = ₦104.6M)
- Fee and bank destination
- Green "Convert to NGN" button
- Same bottom nav with Convert active

---

## Design Tokens

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Background | #FAFBFD | Page background (light) |
| Surface | #F0F2F5 | Cards, panels, sidebar |
| Accent (Primary Blue) | #3375BB | Primary actions, links, active states |
| Accent 100 | #EBF2FA | Light blue tints, icon backgrounds |
| Accent 600 | #2A619E | Hover states |
| Accent 700 | #1E4A7A | Dark blue text on light backgrounds |
| Accent 2 (Green) | #10B981 | Success, positive changes, buy buttons |
| Green hover | #059669 | Buy button hover |
| Red | #EF4444 | Negative changes, sell, errors |
| Red hover | #DC2626 | Sell button hover |
| Purple | #8B5CF6 | Staking badge |
| Yellow | #F59E0B | Pending status |
| Dark BG | #0D1117 | Dark mode background |
| Dark Surface | #161B22 | Dark mode cards |
| Dark Text | #E6EDF3 | Dark mode text |
| Divider | color-mix(in srgb, #1a2332 14%, transparent) | Light mode borders |
| Dark Divider | rgba(230,237,243,0.1) | Dark mode borders |

### Typography
| Style | Font | Size | Weight | Letter-spacing |
|-------|------|------|--------|----------------|
| Display | Archivo | clamp(44px, 6.5vw, 88px) | 800 | -0.025em |
| Page title | Archivo | 24px | 800 | -0.01em |
| Section heading | Archivo | clamp(28px, 3vw, 38px) | 800 | -0.02em |
| Panel title | Archivo | 14px | 800 | — |
| Body | Archivo | 14px | 400 | — |
| Small / labels | Archivo | 13px | 400-600 | — |
| Kicker / uppercase | Archivo | 10-13px | 600 | 0.06-0.1em |
| Stat number | Archivo | clamp(34px, 3.4vw, 52px) | 800 | — |
| Balance large | Archivo | 32-44px | 800 | -0.02em |

### Spacing
Use the design system's `--space-1` through `--space-8` scale. Edge padding: `clamp(16px, 3vw, 32px)`.

### Radius
0px everywhere — no rounded corners. This is a sharp, architectural design.

### Shadows
- sm: `0 1px 2px rgba(0,0,0,0.05)`
- md: `0 3px 10px rgba(0,0,0,0.08)`
- lg: `0 12px 32px rgba(0,0,0,0.12)`

### Icons
Lucide icons throughout (lucide.dev). 16-20px for inline, 28px for feature icons.

---

## Dark/Light Mode
- Toggle persisted in localStorage key `quatava-theme` (values: "dark" / "light")
- Body class `.dark` applied for dark mode
- All colors swap via CSS variables and class overrides
- Transition: `background 0.3s, color 0.3s`

## Logo
- **Q Monogram:** Square (no border-radius), background #3375BB, white "Q" in Archivo 800
- **Wordmark:** "Quatava" in Archivo 800, inherits text color

## Responsive Breakpoints
- 1100px: Collapse 2-column grids to single column
- 900px: Hide sidebar, single-column layout
- 768px: Simplify tables, hide less important columns
- 640px: Stack everything, reduce grid columns

## Files in This Bundle
- `Quatava Landing.dc.html` — Public landing page
- `Quatava Dashboard.dc.html` — Logged-in dashboard
- `Quatava Trading.dc.html` — Spot trading interface
- `Quatava Wallet.dc.html` — Wallet & portfolio management
- `Quatava Convert.dc.html` — **NEW: Instant Convert (replaces P2P)**
- `Quatava Mobile.dc.html` — Mobile app screen references

## Implementation Priority
1. **Convert page** — Core new feature, needs payment processor + price API integration
2. **Dashboard** — User home with local currency display
3. **Wallet** — Asset management + withdrawal to bank
4. **Trading** — Spot trading with chart integration (use TradingView widget)
5. **Landing** — Marketing page
6. **Mobile** — React Native / Flutter implementation
