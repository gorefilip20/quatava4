# Quatava design review — 2026-09-21

## Uploaded references reviewed

- `Document(2).docx`: authenticated wallet screen. White terminal layout with a left sidebar, top search bar, account controls, and wallet summary cards. Visible totals: Total Balance, Spot Balance, Fiat Balance. Primary actions: Deposit, Withdraw, Convert. Main table: Wallet Assets with asset, type, balance, value, 24h, and actions.
- `Document(2)huddle.docx`: authenticated AI Trading screen. Same shell and sidebar. Page title `AI Trading`, subtitle about automated trading strategies powered by machine learning. Three strategy cards: Momentum Bot (RUNNING), Grid Bot (RUNNING), and DCA Bot (PAUSED), with return, allocated amount, win rate, trades/frequency/asset fields, and Configure/Stop/Resume Bot actions. Lower section: AI Performance Summary.
- `Document(3)huddle.docx`: authenticated Dollar Shield screen. Same shell and sidebar. Page title `Dollar Shield`, subtitle about protection from BRL inflation through automatic conversion to stablecoins. Two charts/cards: Purchasing Power — Last 12 Months and Active DCA Plan. Lower section: Auto-Buy Timeline with completed status.
- `Screenshot_20260920-232458.png`: mobile public landing page. White header with hamburger, green Quatava mark, Login and Sign Up buttons. Pale blue/green grid background. Eyebrow `QUATAVA MARKETS`, pill `Built for the next market cycle`, large headline `Crypto, all day. One clear terminal.`, supporting paragraph, and full-width green `Create free account` CTA.
- `Screenshot_20260919-153526.png`: Hostinger build-settings reference, not a product screen. It shows GitHub import, `quatava4`, Other framework preset, branch `main`, Node 22.x, root directory `/`, custom build/output settings, and Deploy button.

## Implementation implication

The authenticated screens share one terminal shell. Remaining four references can be added later as route-specific pages without changing the shell. Demo fallback data must remain visibly preview/paper-only and must never be used for balances, settlement, withdrawals, or live execution.
