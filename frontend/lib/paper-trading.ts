export type PaperSpotOrder = {
  id: string;
  symbol: string;
  currency: string;
  pair: string;
  amount: number;
  price: number | null;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT" | "STOP";
  status: "FILLED" | "OPEN";
  createdAt: string;
};

const STORAGE_KEY = "quatava.paper.spot.orders";

/**
 * Paper trading is deliberately the default. Live execution is only enabled
 * when the deployment explicitly sets NEXT_PUBLIC_TRADING_MODE=LIVE and the
 * backend independently permits live execution.
 */
export function isPaperTradingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_TRADING_MODE !== "LIVE";
}

export function simulatePaperSpotOrder(order: {
  currency: string;
  pair: string;
  amount: number;
  type: "MARKET" | "LIMIT" | "STOP";
  side: "BUY" | "SELL";
  price?: number | null;
  stopPrice?: number;
}): PaperSpotOrder {
  const price = order.price ?? (order.stopPrice || null);
  const paperOrder: PaperSpotOrder = {
    id: `paper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    symbol: `${order.currency}${order.pair}`,
    currency: order.currency,
    pair: order.pair,
    amount: order.amount,
    price,
    side: order.side,
    type: order.type,
    status: order.type === "MARKET" ? "FILLED" : "OPEN",
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const existing = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      const orders = Array.isArray(existing) ? existing : [];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([paperOrder, ...orders].slice(0, 100)));
      window.dispatchEvent(new CustomEvent("quatava:paper-order", { detail: paperOrder }));
    } catch {
      // Local storage is optional; the order result remains available to the caller.
    }
  }

  return paperOrder;
}

export function getPaperSpotOrders(): PaperSpotOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const orders = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(orders) ? orders : [];
  } catch {
    return [];
  }
}
