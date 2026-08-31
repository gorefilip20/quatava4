"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CreditCard,
  Plus,
  Snowflake,
  Play,
  Loader2,
  ShoppingBag,
  Coffee,
  Car,
  Film,
  Utensils,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import {
  useCardStore,
  type VirtualCard,
  type CardTransaction,
} from "@/store/card/card-store";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

// ---------- helpers ----------

const CATEGORY_META: Record<string, { icon: typeof Coffee; color: string; barColor: string }> = {
  food: { icon: Utensils, color: "text-orange-500", barColor: "#f97316" },
  transport: { icon: Car, color: "text-blue-400", barColor: "#60a5fa" },
  shopping: { icon: ShoppingBag, color: "text-pink-500", barColor: "#ec4899" },
  entertainment: { icon: Film, color: "text-purple-500", barColor: "#a855f7" },
  coffee: { icon: Coffee, color: "text-amber-600", barColor: "#d97706" },
  utilities: { icon: Zap, color: "text-teal-500", barColor: "#14b8a6" },
};

function getCategoryMeta(cat: string) {
  const key = cat.toLowerCase();
  return CATEGORY_META[key] || { icon: ShoppingBag, color: "text-muted-foreground", barColor: "#6b7280" };
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupTransactionsByDate(txs: CardTransaction[]): [string, CardTransaction[]][] {
  const map = new Map<string, CardTransaction[]>();
  for (const tx of txs) {
    const label = formatDateLabel(tx.createdAt);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(tx);
  }
  return Array.from(map.entries());
}

// ---------- component ----------

export default function CardClient() {
  const { user } = useUserStore();
  const {
    cards,
    transactions,
    isLoading,
    isCreating,
    fetchCards,
    fetchTransactions,
    createCard,
    topUp,
    freezeCard,
    unfreezeCard,
    setLimits,
  } = useCardStore();

  const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpSource, setTopUpSource] = useState("USDT");
  const [newCardCurrency, setNewCardCurrency] = useState("USDT");
  const [newCardDailyLimit, setNewCardDailyLimit] = useState(500);
  const [showControls, setShowControls] = useState(false);
  const [limitDaily, setLimitDaily] = useState(0);
  const [limitMonthly, setLimitMonthly] = useState(0);

  useEffect(() => {
    fetchCards();
  }, [user]);

  useEffect(() => {
    if (cards.length > 0 && !selectedCard) {
      setSelectedCard(cards[0]);
    }
  }, [cards]);

  useEffect(() => {
    if (selectedCard) {
      fetchTransactions(selectedCard.id);
      setLimitDaily(selectedCard.dailyLimit);
      setLimitMonthly(selectedCard.monthlyLimit);
    }
  }, [selectedCard]);

  const activeCard = selectedCard || cards[0];

  const handleCreateCard = async () => {
    const result = await createCard({
      currency: newCardCurrency,
      fundingSource: newCardCurrency,
      dailyLimit: newCardDailyLimit,
    });
    if (result.success) {
      setShowCreateForm(false);
      fetchCards();
    }
  };

  const handleTopUp = async () => {
    if (!activeCard || !topUpAmount) return;
    const result = await topUp(activeCard.id, parseFloat(topUpAmount), topUpSource);
    if (result.success) {
      setTopUpAmount("");
      fetchCards();
    }
  };

  const handleToggleFreeze = async () => {
    if (!activeCard) return;
    if (activeCard.status === "FROZEN") {
      await unfreezeCard(activeCard.id);
    } else {
      await freezeCard(activeCard.id);
    }
  };

  const handleSetLimits = async () => {
    if (!activeCard) return;
    await setLimits(activeCard.id, limitDaily, limitMonthly);
  };

  // spending breakdown
  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.status === "DECLINED") continue;
      const cat = tx.category || "Other";
      map[cat] = (map[cat] || 0) + tx.amount;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const totalSpending = useMemo(
    () => spendingByCategory.reduce((s, [, v]) => s + v, 0),
    [spendingByCategory]
  );

  const groupedTxs = useMemo(() => groupTransactionsByDate(transactions), [transactions]);

  const cardholderName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Cardholder"
    : "Cardholder";

  return (
    <UserDashboardShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
              Quatava Card
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Your financial identity, everywhere
            </p>
          </div>
          {cards.length > 1 && (
            <div className="flex gap-2">
              {cards.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCard(c)}
                  className={`px-3 py-1.5 text-[12px] font-bold border transition-colors ${
                    selectedCard?.id === c.id
                      ? "border-primary bg-primary/[0.08] text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  **** {c.lastFour}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Card Visual + Top-up row */}
        {activeCard ? (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
            {/* The Card */}
            <div
              className="w-full max-w-[320px] aspect-[1.586/1] relative overflow-hidden select-none mx-auto lg:mx-0"
              style={{
                background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)",
                transition: "transform 0.4s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "perspective(800px) rotateY(3deg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "none";
              }}
            >
              {/* Subtle pattern overlay */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.5) 20px, rgba(255,255,255,0.5) 21px)",
                }}
              />
              <div className="relative z-10 p-5 flex flex-col justify-between h-full text-white">
                {/* Top: Logo + status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[22px] font-extrabold leading-none"
                      style={{ fontFamily: "var(--font-archivo), sans-serif" }}
                    >
                      Q
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white/50 font-bold mt-0.5">
                      Quatava
                    </span>
                  </div>
                  {/* Chip icon */}
                  <div className="w-8 h-6 border border-white/20 bg-gradient-to-br from-yellow-200/30 to-yellow-600/20 flex items-center justify-center">
                    <div className="w-4 h-3 border border-white/15" />
                  </div>
                </div>

                {/* Card number */}
                <div className="mt-auto">
                  <div className="text-[16px] font-mono tracking-[0.18em] text-white/85">
                    {"****  ****  ****  " + activeCard.lastFour}
                  </div>
                  <div className="flex items-end justify-between mt-3">
                    <div>
                      <span className="text-[9px] uppercase tracking-[0.08em] text-white/40 block">
                        Expires
                      </span>
                      <span className="text-[13px] font-mono text-white/70">
                        {String(activeCard.expiryMonth).padStart(2, "0")}/
                        {String(activeCard.expiryYear).slice(-2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-[0.08em] text-white/40 block">
                        Cardholder
                      </span>
                      <span className="text-[12px] font-semibold tracking-wide text-white/70 uppercase">
                        {cardholderName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Status badge */}
              {activeCard.status !== "ACTIVE" && (
                <div className="absolute top-3 right-3 z-20">
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-blue-400/25 text-blue-200">
                    {activeCard.status}
                  </span>
                </div>
              )}
            </div>

            {/* Top-up inline form */}
            <div className="flex flex-col gap-5">
              <div className="bg-card border border-border p-5">
                <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-3">
                  Top Up Card
                </span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Amount (USD)"
                    className="flex-1 bg-muted border border-border px-3 py-2.5 text-[14px] focus:outline-none focus:border-primary transition-colors"
                  />
                  <select
                    value={topUpSource}
                    onChange={(e) => setTopUpSource(e.target.value)}
                    className="bg-muted border border-border px-3 py-2.5 text-[13px] font-semibold focus:outline-none focus:border-primary transition-colors min-w-[100px]"
                  >
                    <option value="USDT">USDT</option>
                    <option value="USDC">USDC</option>
                    <option value="BTC">BTC</option>
                  </select>
                  <button
                    onClick={handleTopUp}
                    disabled={!topUpAmount}
                    className="px-6 py-2.5 bg-primary text-white text-[13px] font-bold hover:bg-primary/90 transition-colors disabled:opacity-40"
                  >
                    Top Up
                  </button>
                </div>
              </div>

              {/* New Card creation (compact) */}
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 text-[12px] font-semibold text-primary hover:underline self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create another card
                </button>
              ) : (
                <div className="bg-card border border-border p-5">
                  <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-3">
                    New Card
                  </span>
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                      <label className="text-[11px] text-muted-foreground block mb-1">Funding Source</label>
                      <div className="flex gap-2">
                        {["USDT", "USDC", "BTC"].map((c) => (
                          <button
                            key={c}
                            onClick={() => setNewCardCurrency(c)}
                            className={`flex-1 py-2 text-[13px] font-semibold border transition-colors ${
                              newCardCurrency === c
                                ? "border-primary bg-primary/[0.08] text-primary"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <label className="text-[11px] text-muted-foreground block mb-1">Daily Limit</label>
                      <div className="flex gap-2">
                        {[500, 1000, 5000].map((lim) => (
                          <button
                            key={lim}
                            onClick={() => setNewCardDailyLimit(lim)}
                            className={`flex-1 py-2 text-[13px] font-semibold border transition-colors ${
                              newCardDailyLimit === lim
                                ? "border-primary bg-primary/[0.08] text-primary"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            ${lim.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateCard}
                        disabled={isCreating}
                        className="px-5 py-2.5 bg-primary text-white text-[13px] font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Create
                      </button>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2.5 border border-border text-[13px] font-semibold hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border p-12 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-[15px] font-semibold">No cards yet</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Create your first virtual card to get started
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Card
            </button>
          </div>
        )}

        {/* Stats row — single stripe */}
        {activeCard && (
          <div className="bg-card border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {/* Balance */}
              <div className="p-4 sm:p-5">
                <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-1">
                  Balance
                </span>
                <span className="text-[22px] font-extrabold">
                  ${activeCard.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Daily */}
              <div className="p-4 sm:p-5">
                <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-1">
                  Daily Spent / Limit
                </span>
                <span className="text-[18px] font-extrabold">
                  ${activeCard.dailySpent.toLocaleString()}
                  <span className="text-[13px] font-semibold text-muted-foreground">
                    {" "}/ ${activeCard.dailyLimit.toLocaleString()}
                  </span>
                </span>
                <div className="mt-2 h-[3px] bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.min((activeCard.dailySpent / activeCard.dailyLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Monthly */}
              <div className="p-4 sm:p-5">
                <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-1">
                  Monthly Spent / Limit
                </span>
                <span className="text-[18px] font-extrabold">
                  ${activeCard.monthlySpent.toLocaleString()}
                  <span className="text-[13px] font-semibold text-muted-foreground">
                    {" "}/ ${activeCard.monthlyLimit.toLocaleString()}
                  </span>
                </span>
                <div className="mt-2 h-[3px] bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.min((activeCard.monthlySpent / activeCard.monthlyLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Spending Breakdown — horizontal stacked bar */}
        {activeCard && spendingByCategory.length > 0 && (
          <div>
            <h2 className="text-[16px] font-bold mb-3">Spending Breakdown</h2>
            <div className="bg-card border border-border p-5">
              {/* Bar */}
              <div className="w-full h-5 flex overflow-hidden">
                {spendingByCategory.map(([cat, amount]) => {
                  const pct = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;
                  const meta = getCategoryMeta(cat);
                  return (
                    <div
                      key={cat}
                      style={{ width: `${pct}%`, backgroundColor: meta.barColor, minWidth: pct > 0 ? 4 : 0 }}
                      className="h-full transition-all"
                      title={`${cat}: $${amount.toFixed(2)} (${pct.toFixed(0)}%)`}
                    />
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
                {spendingByCategory.map(([cat, amount]) => {
                  const meta = getCategoryMeta(cat);
                  const CatIcon = meta.icon;
                  return (
                    <div key={cat} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5" style={{ backgroundColor: meta.barColor }} />
                      <CatIcon className={`w-3 h-3 ${meta.color}`} />
                      <span className="text-[12px] text-muted-foreground">
                        {cat}
                      </span>
                      <span className="text-[12px] font-semibold">
                        ${amount.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Transaction list — grouped by date */}
        <div>
          <h2 className="text-[16px] font-bold mb-3">Transactions</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card border border-border p-4 animate-pulse">
                  <div className="h-4 bg-muted w-1/3 mb-2" />
                  <div className="h-3 bg-muted w-1/2" />
                </div>
              ))}
            </div>
          ) : groupedTxs.length > 0 ? (
            <div className="space-y-4">
              {groupedTxs.map(([dateLabel, txs]) => (
                <div key={dateLabel}>
                  <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-1.5 pl-1">
                    {dateLabel}
                  </span>
                  <div className="bg-card border border-border overflow-hidden">
                    {txs.map((tx, idx) => {
                      const meta = getCategoryMeta(tx.category);
                      const CatIcon = meta.icon;
                      const isDeposit =
                        tx.category?.toLowerCase() === "deposit" ||
                        tx.merchant?.toLowerCase().includes("top up") ||
                        tx.merchant?.toLowerCase().includes("deposit");
                      return (
                        <div
                          key={tx.id}
                          className={`flex items-center gap-3 px-4 py-3 ${
                            idx % 2 === 1 ? "bg-muted/30" : ""
                          } ${idx > 0 ? "border-t border-border" : ""}`}
                        >
                          <div className={`w-8 h-8 flex items-center justify-center ${isDeposit ? "bg-success/[0.08]" : "bg-muted"}`}>
                            <CatIcon className={`w-4 h-4 ${isDeposit ? "text-success" : meta.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-semibold block truncate">
                              {tx.merchant}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {tx.category}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`text-[14px] font-bold block ${
                                isDeposit ? "text-success" : ""
                              }`}
                            >
                              {isDeposit ? "+" : "-"}$
                              {tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border p-10 text-center">
              <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-[14px] font-semibold">No transactions yet</p>
              <p className="text-[13px] text-muted-foreground mt-1">
                Transactions will appear here when you use your card.
              </p>
            </div>
          )}
        </div>

        {/* Controls — collapsible panel */}
        {activeCard && (
          <div className="bg-card border border-border">
            <button
              onClick={() => setShowControls(!showControls)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <span className="text-[14px] font-bold">Card Controls</span>
              {showControls ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {showControls && (
              <div className="border-t border-border p-5 space-y-6">
                {/* Freeze toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[13px] font-semibold block">
                      {activeCard.status === "FROZEN" ? "Card is frozen" : "Freeze card"}
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      {activeCard.status === "FROZEN"
                        ? "Unfreeze to resume spending"
                        : "Temporarily disable all transactions"}
                    </span>
                  </div>
                  <button
                    onClick={handleToggleFreeze}
                    className={`flex items-center gap-2 px-4 py-2 text-[13px] font-bold transition-colors ${
                      activeCard.status === "FROZEN"
                        ? "bg-success/[0.08] text-success border border-success/20 hover:bg-success/[0.15]"
                        : "bg-destructive/[0.08] text-destructive border border-destructive/20 hover:bg-destructive/[0.15]"
                    }`}
                  >
                    {activeCard.status === "FROZEN" ? (
                      <>
                        <Play className="w-3.5 h-3.5" /> Unfreeze
                      </>
                    ) : (
                      <>
                        <Snowflake className="w-3.5 h-3.5" /> Freeze
                      </>
                    )}
                  </button>
                </div>

                {/* Limit sliders */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground">
                        Daily Limit
                      </span>
                      <span className="text-[13px] font-bold">${limitDaily.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={10000}
                      step={100}
                      value={limitDaily}
                      onChange={(e) => setLimitDaily(Number(e.target.value))}
                      className="w-full accent-[#3375BB] h-1.5"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>$100</span>
                      <span>$10,000</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground">
                        Monthly Limit
                      </span>
                      <span className="text-[13px] font-bold">${limitMonthly.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={50000}
                      step={500}
                      value={limitMonthly}
                      onChange={(e) => setLimitMonthly(Number(e.target.value))}
                      className="w-full accent-[#3375BB] h-1.5"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>$500</span>
                      <span>$50,000</span>
                    </div>
                  </div>
                  <button
                    onClick={handleSetLimits}
                    className="px-5 py-2.5 bg-primary text-white text-[13px] font-bold hover:bg-primary/90 transition-colors"
                  >
                    Save Limits
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </UserDashboardShell>
  );
}
