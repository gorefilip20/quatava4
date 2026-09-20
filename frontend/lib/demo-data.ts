/**
 * Safe read-only preview data used when the backend/database is unavailable.
 * Never use these values for balances, order settlement, withdrawals, or writes.
 */
export const DEMO_DATA_ENABLED = process.env.NEXT_PUBLIC_DEMO_FALLBACK !== "false";

export const DEMO_MARKETS = [
  { id: "demo-btc", currency: "BTC", pair: "USDT", symbol: "BTC/USDT", displaySymbol: "BTC/USDT", price: 109482.18, change: 2.84, volume: 42800000000, status: true, isDemo: true, metadata: { precision: { price: 2, amount: 6 } } },
  { id: "demo-eth", currency: "ETH", pair: "USDT", symbol: "ETH/USDT", displaySymbol: "ETH/USDT", price: 4028.64, change: 1.96, volume: 18400000000, status: true, isDemo: true, metadata: { precision: { price: 2, amount: 5 } } },
  { id: "demo-sol", currency: "SOL", pair: "USDT", symbol: "SOL/USDT", displaySymbol: "SOL/USDT", price: 248.12, change: 5.42, volume: 6800000000, status: true, isDemo: true, metadata: { precision: { price: 2, amount: 3 } } },
  { id: "demo-bnb", currency: "BNB", pair: "USDT", symbol: "BNB/USDT", displaySymbol: "BNB/USDT", price: 712.38, change: -0.74, volume: 2900000000, status: true, isDemo: true, metadata: { precision: { price: 2, amount: 3 } } },
  { id: "demo-xrp", currency: "XRP", pair: "USDT", symbol: "XRP/USDT", displaySymbol: "XRP/USDT", price: 2.31, change: 3.18, volume: 2200000000, status: true, isDemo: true, metadata: { precision: { price: 4, amount: 1 } } },
];

export const DEMO_NFT_LISTINGS = [
  { id: "demo-listing-1", type: "FIXED_PRICE", price: "1.25", currency: "ETH", status: "ACTIVE", isDemo: true, token: { id: "demo-token-1", name: "Neon Genesis #01", image: "", collection: { name: "Quatava Genesis", isVerified: true } } },
  { id: "demo-listing-2", type: "AUCTION", price: "2.40", currency: "ETH", endTime: new Date(Date.now() + 2 * 86400000).toISOString(), status: "ACTIVE", isDemo: true, token: { id: "demo-token-2", name: "Midnight Circuit #07", image: "", collection: { name: "Digital Horizons", isVerified: true } } },
  { id: "demo-listing-3", type: "BUNDLE", price: "0.85", currency: "ETH", status: "ACTIVE", isDemo: true, token: { id: "demo-token-3", name: "Aurora Relic #12", image: "", collection: { name: "Aurora Relics", isVerified: false } } },
];

export const DEMO_SETTINGS = {
  isDemo: true,
  tradingMode: "paper",
  maintenance: false,
  features: { spotTrading: true, futuresTrading: true, nftMarketplace: true },
};

export function getDemoFallback(url: string, method = "GET"): unknown | null {
  if (!DEMO_DATA_ENABLED || method.toUpperCase() !== "GET") return null;
  const path = url.split("?")[0];
  if (path.endsWith("/api/exchange/market") || path.endsWith("/api/futures/market")) return DEMO_MARKETS;
  if (path.endsWith("/api/nft/listing") || path.endsWith("/api/nft/marketplace")) return DEMO_NFT_LISTINGS;
  if (path.endsWith("/api/settings")) return DEMO_SETTINGS;
  return null;
}

export function isDemoPayload(value: unknown): boolean {
  return Boolean(value && typeof value === "object" && (value as { isDemo?: boolean }).isDemo);
}
