"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Snowflake,
  Play,
  Plus,
  SlidersHorizontal,
  ArrowUpCircle,
  Clock,
  ShieldCheck,
  Zap,
  Copy,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  useCardStore,
  type VirtualCard,
  type CardTransaction,
} from "@/store/card/card-store";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

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
  const [showTopUp, setShowTopUp] = useState(false);
  const [showLimits, setShowLimits] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpSource, setTopUpSource] = useState("USDT");
  const [newCardCurrency, setNewCardCurrency] = useState("USDT");
  const [newCardDailyLimit, setNewCardDailyLimit] = useState(500);
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
      setShowTopUp(false);
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
    const result = await setLimits(activeCard.id, limitDaily, limitMonthly);
    if (result.success) {
      setShowLimits(false);
    }
  };

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
              Quatava Card
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Spend crypto as dollars anywhere in the world
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Card
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Card Display */}
            {activeCard ? (
              <div className="relative overflow-hidden bg-gradient-to-br from-[#3375BB] via-[#2b68a8] to-[#1a4d80] p-6 text-white min-h-[220px] flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/[0.04] -translate-y-1/2 translate-x-1/2" style={{ borderRadius: "50%" }} />
                <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-white/[0.03] translate-y-1/2 -translate-x-1/2" style={{ borderRadius: "50%" }} />
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.1em] text-white/60 font-bold">
                      Quatava Virtual Card
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase ${
                          activeCard.status === "ACTIVE"
                            ? "bg-[#10B981]/20 text-[#10B981]"
                            : activeCard.status === "FROZEN"
                            ? "bg-blue-400/20 text-blue-300"
                            : "bg-red-400/20 text-red-300"
                        }`}
                      >
                        {activeCard.status}
                      </span>
                    </div>
                  </div>
                  <CreditCard className="w-8 h-8 text-white/40" />
                </div>
                <div className="relative z-10 mt-6">
                  <div className="text-[22px] font-mono tracking-[0.12em] text-white/90">
                    **** **** **** {activeCard.lastFour}
                  </div>
                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.06em] text-white/50 block">
                        Expires
                      </span>
                      <span className="text-[14px] font-mono text-white/80">
                        {String(activeCard.expiryMonth).padStart(2, "0")}/{String(activeCard.expiryYear).slice(-2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-[0.06em] text-white/50 block">
                        Balance
                      </span>
                      <span className="text-[24px] font-extrabold">
                        ${activeCard.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
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
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Card
                </button>
              </div>
            )}

            {/* Stats */}
            {activeCard && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                      <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                      Card Balance
                    </span>
                  </div>
                  <div className="text-[20px] font-extrabold">
                    ${activeCard.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-card border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                      Daily Spent / Limit
                    </span>
                  </div>
                  <div className="text-[20px] font-extrabold">
                    ${activeCard.dailySpent.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    <span className="text-[13px] font-semibold text-muted-foreground">
                      {" "}/ ${activeCard.dailyLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.min((activeCard.dailySpent / activeCard.dailyLimit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="bg-card border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                      Monthly Spent / Limit
                    </span>
                  </div>
                  <div className="text-[20px] font-extrabold">
                    ${activeCard.monthlySpent.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    <span className="text-[13px] font-semibold text-muted-foreground">
                      {" "}/ ${activeCard.monthlyLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.min((activeCard.monthlySpent / activeCard.monthlyLimit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {activeCard && (
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setShowTopUp(true)}
                  className="bg-card border border-border p-4 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors group"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-success/[0.08] group-hover:bg-success/[0.15] transition-colors">
                    <ArrowUpCircle className="w-5 h-5 text-success" />
                  </div>
                  <span className="text-[12px] font-semibold">Top Up</span>
                </button>
                <button
                  onClick={handleToggleFreeze}
                  className="bg-card border border-border p-4 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors group"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-primary/[0.08] group-hover:bg-primary/[0.15] transition-colors">
                    {activeCard.status === "FROZEN" ? (
                      <Play className="w-5 h-5 text-primary" />
                    ) : (
                      <Snowflake className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <span className="text-[12px] font-semibold">
                    {activeCard.status === "FROZEN" ? "Unfreeze" : "Freeze"}
                  </span>
                </button>
                <button
                  onClick={() => setShowLimits(true)}
                  className="bg-card border border-border p-4 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors group"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-primary/[0.08] group-hover:bg-primary/[0.15] transition-colors">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[12px] font-semibold">Set Limits</span>
                </button>
              </div>
            )}

            {/* Top Up Modal */}
            {showTopUp && activeCard && (
              <div className="bg-card border border-border p-5">
                <h3 className="font-extrabold text-[15px] mb-4">Top Up Card</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                      Amount (USD)
                    </label>
                    <input
                      type="number"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-muted border border-border px-3 py-2.5 text-[14px] focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                      Pay With
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["USDT", "USDC", "BTC"].map((src) => (
                        <button
                          key={src}
                          onClick={() => setTopUpSource(src)}
                          className={`py-2 text-[13px] font-semibold border transition-colors ${
                            topUpSource === src
                              ? "border-primary bg-primary/[0.08] text-primary"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          {src}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleTopUp}
                      className="flex-1 py-2.5 bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Top Up
                    </button>
                    <button
                      onClick={() => setShowTopUp(false)}
                      className="px-4 py-2.5 border border-border text-[13px] font-semibold hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Set Limits Modal */}
            {showLimits && activeCard && (
              <div className="bg-card border border-border p-5">
                <h3 className="font-extrabold text-[15px] mb-4">Set Spending Limits</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                      Daily Limit (USD)
                    </label>
                    <input
                      type="number"
                      value={limitDaily}
                      onChange={(e) => setLimitDaily(Number(e.target.value))}
                      className="w-full bg-muted border border-border px-3 py-2.5 text-[14px] focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                      Monthly Limit (USD)
                    </label>
                    <input
                      type="number"
                      value={limitMonthly}
                      onChange={(e) => setLimitMonthly(Number(e.target.value))}
                      className="w-full bg-muted border border-border px-3 py-2.5 text-[14px] focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSetLimits}
                      className="flex-1 py-2.5 bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Save Limits
                    </button>
                    <button
                      onClick={() => setShowLimits(false)}
                      className="px-4 py-2.5 border border-border text-[13px] font-semibold hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div>
              <h2 className="text-[18px] font-bold mb-4">Recent Transactions</h2>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-card border border-border p-4 animate-pulse"
                    >
                      <div className="h-4 bg-muted w-1/3 mb-2" />
                      <div className="h-3 bg-muted w-1/2" />
                    </div>
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="bg-card border border-border overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Merchant
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Category
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Amount
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Status
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="p-3 text-[13px] font-semibold">
                            {tx.merchant}
                          </td>
                          <td className="p-3 text-[13px] text-muted-foreground">
                            {tx.category}
                          </td>
                          <td className="p-3 text-[13px] font-semibold">
                            -${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${
                                tx.status === "COMPLETED"
                                  ? "bg-success/[0.08] text-success"
                                  : tx.status === "PENDING"
                                  ? "bg-yellow-500/[0.08] text-yellow-600"
                                  : "bg-destructive/[0.08] text-destructive"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-3 text-[13px] text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-card border border-border p-8 text-center">
                  <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-[14px] font-semibold">No transactions yet</p>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Transactions will appear here when you use your card.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Create Card Form */}
            {showCreateForm && (
              <div className="bg-card border border-border p-4">
                <h3 className="font-extrabold text-sm mb-4">Create New Card</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                      Funding Source
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["USDT", "USDC", "BTC"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setNewCardCurrency(c)}
                          className={`py-2 text-[13px] font-semibold border transition-colors ${
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
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                      Daily Limit
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[500, 1000, 5000].map((limit) => (
                        <button
                          key={limit}
                          onClick={() => setNewCardDailyLimit(limit)}
                          className={`py-2 text-[13px] font-semibold border transition-colors ${
                            newCardDailyLimit === limit
                              ? "border-primary bg-primary/[0.08] text-primary"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          ${limit.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleCreateCard}
                    disabled={isCreating}
                    className="w-full py-2.5 bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Card
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="w-full py-2 border border-border text-[13px] font-semibold hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Card Selector */}
            {cards.length > 1 && (
              <div className="bg-card border border-border p-4">
                <h3 className="font-extrabold text-sm mb-3">Your Cards</h3>
                <div className="space-y-2">
                  {cards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className={`w-full p-3 border text-left flex items-center gap-3 transition-colors ${
                        selectedCard?.id === card.id
                          ? "border-primary bg-primary/[0.08]"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <span className="text-[13px] font-semibold block">
                          **** {card.lastFour}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          ${card.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })} - {card.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="bg-card border border-border p-4">
              <h3 className="font-extrabold text-sm mb-4">How It Works</h3>
              <div className="flex flex-col gap-3 text-[13px]">
                {[
                  {
                    icon: Plus,
                    title: "1. Create a card",
                    text: "Choose your funding source and set your limits",
                  },
                  {
                    icon: ArrowUpCircle,
                    title: "2. Top up",
                    text: "Add funds using USDT, USDC, or BTC",
                  },
                  {
                    icon: CreditCard,
                    title: "3. Spend anywhere",
                    text: "Use your card online or with Apple/Google Pay",
                  },
                  {
                    icon: ShieldCheck,
                    title: "4. Stay in control",
                    text: "Freeze, set limits, and track spending in real time",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 flex items-center justify-center bg-primary/[0.08] shrink-0 mt-0.5">
                      <item.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <span className="font-semibold block">{item.title}</span>
                      <span className="text-muted-foreground text-[12px]">
                        {item.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserDashboardShell>
  );
}
