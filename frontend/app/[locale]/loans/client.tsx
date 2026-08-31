"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Landmark,
  ArrowRight,
  AlertTriangle,
  TrendingDown,
  Shield,
  Clock,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useLoanStore, type Loan } from "@/store/loans/loan-store";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

const COLLATERAL_CURRENCIES = [
  { value: "BTC", label: "Bitcoin (BTC)" },
  { value: "ETH", label: "Ethereum (ETH)" },
  { value: "USDT", label: "Tether (USDT)" },
  { value: "SOL", label: "Solana (SOL)" },
];

const BORROW_CURRENCIES = [
  { value: "BRL", label: "BRL - Real" },
  { value: "ARS", label: "ARS - Peso" },
  { value: "COP", label: "COP - Peso" },
  { value: "CLP", label: "CLP - Peso" },
  { value: "PEN", label: "PEN - Sol" },
  { value: "MXN", label: "MXN - Peso" },
  { value: "USD", label: "USD - Dollar" },
];

const DURATIONS = [30, 60, 90];

const MOCK_PRICES: Record<string, number> = {
  BTC: 67500,
  ETH: 3850,
  USDT: 1,
  SOL: 178,
};

const MOCK_RATES: Record<string, number> = {
  BRL: 5.15,
  ARS: 890,
  COP: 3950,
  CLP: 935,
  PEN: 3.72,
  MXN: 17.2,
  USD: 1,
};

const STEPS = [
  {
    step: 1,
    title: "Deposit Collateral",
    desc: "Choose a crypto asset as collateral. Your funds are locked securely in a smart contract.",
  },
  {
    step: 2,
    title: "Receive Loan",
    desc: "Get your loan in local currency or stablecoins instantly. No credit check needed.",
  },
  {
    step: 3,
    title: "Repay & Unlock",
    desc: "Repay the loan + interest by the due date to unlock your collateral.",
  },
];

const FAQ_ITEMS = [
  {
    q: "What happens if my collateral drops in value?",
    a: "If LTV exceeds 85%, your position may be partially liquidated to maintain a safe ratio.",
  },
  {
    q: "Can I repay early?",
    a: "Yes, you can repay at any time with no prepayment penalty. Interest is charged only for the days used.",
  },
  {
    q: "What is the minimum collateral?",
    a: "Minimum collateral varies by asset. For BTC, it is 0.001 BTC. For ETH, 0.01 ETH.",
  },
];

export default function LoansClient() {
  const { user } = useUserStore();
  const {
    loans,
    terms,
    isLoading,
    isBorrowing,
    fetchLoans,
    fetchTerms,
    borrow,
    repay,
  } = useLoanStore();

  const [collateralCurrency, setCollateralCurrency] = useState("BTC");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [borrowCurrency, setBorrowCurrency] = useState("USD");
  const [duration, setDuration] = useState(30);
  const [repayingLoanId, setRepayingLoanId] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchLoans();
      fetchTerms();
    }
  }, [user]);

  const activeLoans = useMemo(
    () => loans.filter((l) => l.status === "ACTIVE"),
    [loans]
  );

  const totalBorrowed = useMemo(
    () => activeLoans.reduce((sum, l) => sum + l.borrowAmount, 0),
    [activeLoans]
  );

  const totalCollateral = useMemo(
    () =>
      activeLoans.reduce(
        (sum, l) =>
          sum + l.collateralAmount * (MOCK_PRICES[l.collateralCurrency] || 0),
        0
      ),
    [activeLoans]
  );

  const avgLtv = useMemo(() => {
    if (activeLoans.length === 0) return 0;
    return (
      activeLoans.reduce((sum, l) => sum + l.ltv, 0) / activeLoans.length
    );
  }, [activeLoans]);

  // Calculations
  const collateralUsdValue = useMemo(() => {
    const amt = parseFloat(collateralAmount) || 0;
    return amt * (MOCK_PRICES[collateralCurrency] || 0);
  }, [collateralAmount, collateralCurrency]);

  const ltvRatio = 50; // 50% LTV
  const interestRate = useMemo(() => {
    if (duration === 30) return 5.5;
    if (duration === 60) return 7.0;
    return 8.5;
  }, [duration]);

  const borrowableUsd = collateralUsdValue * (ltvRatio / 100);
  const borrowableLocal = borrowableUsd * (MOCK_RATES[borrowCurrency] || 1);

  const liquidationPrice = useMemo(() => {
    if (!collateralAmount || parseFloat(collateralAmount) <= 0) return 0;
    const amt = parseFloat(collateralAmount);
    // Liquidation at 85% LTV
    return (borrowableUsd / (0.85 * amt));
  }, [borrowableUsd, collateralAmount]);

  const totalRepayment = useMemo(() => {
    const interest = borrowableLocal * (interestRate / 100) * (duration / 365);
    return borrowableLocal + interest;
  }, [borrowableLocal, interestRate, duration]);

  const handleBorrow = async () => {
    if (!collateralAmount || parseFloat(collateralAmount) <= 0) return;
    const result = await borrow({
      collateralCurrency,
      collateralAmount: parseFloat(collateralAmount),
      borrowCurrency,
      durationDays: duration,
    });
    if (result.success) {
      setCollateralAmount("");
      fetchLoans();
    }
  };

  const handleRepay = async (loanId: string) => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) return;
    const result = await repay(loanId, parseFloat(repayAmount));
    if (result.success) {
      setRepayingLoanId(null);
      setRepayAmount("");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const ltvColor = (ltv: number) => {
    if (ltv < 50) return "bg-[#10B981]";
    if (ltv < 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const ltvTextColor = (ltv: number) => {
    if (ltv < 50) return "text-[#10B981]";
    if (ltv < 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
            Crypto Loans
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Borrow against your crypto — no credit check, no selling
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Landmark className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Active Loans
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                activeLoans.length
              )}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Borrowed
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                `$${totalBorrowed.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              )}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-[#10B981]/[0.08]">
                <Shield className="w-4 h-4 text-[#10B981]" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Collateral
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-[#10B981]">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                `$${totalCollateral.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              )}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <TrendingDown className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Average LTV
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                `${avgLtv.toFixed(1)}%`
              )}
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left Panel */}
          <div className="space-y-6">
            {/* Borrow Form */}
            <div className="bg-card border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Landmark className="w-5 h-5 text-primary" />
                <h2 className="text-[18px] font-bold">Borrow</h2>
              </div>

              <div className="space-y-5">
                {/* Collateral */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                    Collateral
                  </label>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <select
                      value={collateralCurrency}
                      onChange={(e) => setCollateralCurrency(e.target.value)}
                      className="p-3 text-[13px] bg-card border border-border text-foreground outline-none"
                    >
                      {COLLATERAL_CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.value}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={collateralAmount}
                      onChange={(e) => setCollateralAmount(e.target.value)}
                      placeholder="0.00"
                      min={0}
                      step="any"
                      className="p-3 text-[13px] bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>
                  {collateralUsdValue > 0 && (
                    <span className="text-[12px] text-muted-foreground mt-1 block">
                      ~$
                      {collateralUsdValue.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  )}
                </div>

                {/* Borrow */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                    Borrow
                  </label>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <select
                      value={borrowCurrency}
                      onChange={(e) => setBorrowCurrency(e.target.value)}
                      className="p-3 text-[13px] bg-card border border-border text-foreground outline-none"
                    >
                      {BORROW_CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.value}
                        </option>
                      ))}
                    </select>
                    <div className="p-3 text-[13px] bg-muted/30 border border-border text-foreground font-bold">
                      {borrowableLocal > 0
                        ? borrowableLocal.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "0.00"}
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                    Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`py-3 text-[13px] font-bold border transition-colors ${
                          duration === d
                            ? "bg-primary text-white border-primary"
                            : "bg-card border-border text-foreground hover:bg-muted/50"
                        }`}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Calculation Box */}
                {collateralUsdValue > 0 && (
                  <div className="bg-primary/[0.08] border border-primary/20 p-4 space-y-3">
                    <h3 className="text-[13px] font-bold text-primary">
                      Loan Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                          LTV Ratio
                        </span>
                        <span className="text-[16px] font-extrabold">
                          {ltvRatio}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                          Interest Rate
                        </span>
                        <span className="text-[16px] font-extrabold">
                          {interestRate}% APR
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                          Liquidation Price
                        </span>
                        <span className="text-[16px] font-extrabold text-red-500">
                          $
                          {liquidationPrice.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                          Total Repayment
                        </span>
                        <span className="text-[16px] font-extrabold">
                          {totalRepayment.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {borrowCurrency}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Borrow Button */}
                <button
                  onClick={handleBorrow}
                  disabled={
                    isBorrowing ||
                    !collateralAmount ||
                    parseFloat(collateralAmount) <= 0
                  }
                  className="w-full py-3 bg-primary text-white text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isBorrowing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Landmark className="w-4 h-4" />
                      Borrow Now
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Active Loans */}
            <div className="bg-card border border-border p-6">
              <h2 className="text-[18px] font-bold mb-4">Active Loans</h2>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse border border-border p-5"
                    >
                      <div className="h-5 bg-muted w-1/3 mb-3" />
                      <div className="h-4 bg-muted w-2/3 mb-2" />
                      <div className="h-4 bg-muted w-1/2" />
                    </div>
                  ))}
                </div>
              ) : activeLoans.length === 0 ? (
                <div className="text-center py-10">
                  <Landmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-[14px] font-semibold text-muted-foreground">
                    No active loans
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Use the form above to borrow against your crypto
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className="border border-border p-5"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-[14px] font-bold">
                            {loan.collateralAmount} {loan.collateralCurrency}{" "}
                            <ArrowRight className="w-3.5 h-3.5 inline text-muted-foreground" />{" "}
                            {loan.borrowAmount.toLocaleString()}{" "}
                            {loan.borrowCurrency}
                          </h3>
                          <p className="text-[12px] text-muted-foreground mt-0.5">
                            Due: {formatDate(loan.dueDate)}
                          </p>
                        </div>
                        <span
                          className={`text-[11px] font-bold uppercase px-2 py-0.5 ${
                            loan.status === "ACTIVE"
                              ? "bg-[#10B981]/[0.08] text-[#10B981]"
                              : loan.status === "LIQUIDATED"
                                ? "bg-red-500/[0.08] text-red-500"
                                : "bg-gray-500/[0.08] text-gray-500"
                          }`}
                        >
                          {loan.status}
                        </span>
                      </div>

                      {/* LTV Gauge */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                            LTV Ratio
                          </span>
                          <span
                            className={`text-[13px] font-bold ${ltvTextColor(loan.ltv)}`}
                          >
                            {loan.ltv.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-muted">
                          <div
                            className={`h-full transition-all ${ltvColor(loan.ltv)}`}
                            style={{
                              width: `${Math.min(loan.ltv, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                            Interest
                          </span>
                          <span className="text-[13px] font-semibold">
                            {loan.interestRate}% APR
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                            Liquidation
                          </span>
                          <span className="text-[13px] font-semibold text-red-500">
                            $
                            {loan.liquidationPrice.toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                            Repaid
                          </span>
                          <span className="text-[13px] font-semibold">
                            $
                            {loan.repaidAmount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>

                      {repayingLoanId === loan.id ? (
                        <div className="border-t border-border pt-4 space-y-3">
                          <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                            Repay Amount ({loan.borrowCurrency})
                          </label>
                          <input
                            type="number"
                            value={repayAmount}
                            onChange={(e) => setRepayAmount(e.target.value)}
                            placeholder="0.00"
                            min={0}
                            step="any"
                            className="w-full p-3 text-[13px] bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRepay(loan.id)}
                              className="flex-1 py-2.5 bg-[#10B981] text-white text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#10B981]/90 transition-colors"
                            >
                              Confirm Repay
                            </button>
                            <button
                              onClick={() => {
                                setRepayingLoanId(null);
                                setRepayAmount("");
                              }}
                              className="px-4 py-2.5 border border-border text-[13px] font-semibold hover:bg-muted/50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRepayingLoanId(loan.id)}
                          className="w-full py-2.5 border border-border text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-muted/50 transition-colors"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Repay
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Risk Warning */}
            <div className="bg-yellow-500/[0.05] border-2 border-yellow-500/30 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-yellow-500/[0.08] shrink-0">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-yellow-700 dark:text-yellow-300">
                    Liquidation Risk
                  </h3>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    If the value of your collateral drops significantly, your
                    position may be partially or fully liquidated to cover the
                    loan. This happens when your Loan-to-Value (LTV) ratio
                    exceeds 85%. Monitor your positions regularly and add
                    collateral if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* How Crypto Loans Work */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[16px] font-bold mb-4">
                How Crypto Loans Work
              </h3>
              <div className="space-y-4">
                {STEPS.map((s) => (
                  <div key={s.step} className="flex gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary text-white text-[13px] font-extrabold shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold">{s.title}</h4>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms Overview */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[16px] font-bold mb-3">Terms</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-[12px] text-muted-foreground">
                    Max LTV
                  </span>
                  <span className="text-[13px] font-bold">50%</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-[12px] text-muted-foreground">
                    Liquidation LTV
                  </span>
                  <span className="text-[13px] font-bold text-red-500">
                    85%
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-[12px] text-muted-foreground">
                    Interest (30d)
                  </span>
                  <span className="text-[13px] font-bold">5.5% APR</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-[12px] text-muted-foreground">
                    Interest (60d)
                  </span>
                  <span className="text-[13px] font-bold">7.0% APR</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-[12px] text-muted-foreground">
                    Interest (90d)
                  </span>
                  <span className="text-[13px] font-bold">8.5% APR</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[12px] text-muted-foreground">
                    Prepayment Fee
                  </span>
                  <span className="text-[13px] font-bold text-[#10B981]">
                    None
                  </span>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[16px] font-bold mb-3">FAQ</h3>
              <div className="space-y-2">
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} className="border border-border">
                    <button
                      onClick={() =>
                        setExpandedFaq(expandedFaq === i ? null : i)
                      }
                      className="w-full text-left p-3 flex items-center justify-between text-[13px] font-semibold hover:bg-muted/30 transition-colors"
                    >
                      {item.q}
                      <ArrowRight
                        className={`w-3.5 h-3.5 text-muted-foreground shrink-0 ml-2 transition-transform ${
                          expandedFaq === i ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                    {expandedFaq === i && (
                      <div className="px-3 pb-3">
                        <p className="text-[12px] text-muted-foreground">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Collateral Currencies */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[16px] font-bold mb-3">
                Accepted Collateral
              </h3>
              <div className="space-y-2">
                {COLLATERAL_CURRENCIES.map((c) => (
                  <div
                    key={c.value}
                    className="flex items-center justify-between p-2 border border-border"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 flex items-center justify-center bg-primary/[0.08] text-[10px] font-extrabold text-primary">
                        {c.value[0]}
                      </div>
                      <span className="text-[13px] font-semibold">
                        {c.label}
                      </span>
                    </div>
                    <span className="text-[12px] text-muted-foreground">
                      $
                      {(MOCK_PRICES[c.value] || 0).toLocaleString("en-US")}
                    </span>
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
