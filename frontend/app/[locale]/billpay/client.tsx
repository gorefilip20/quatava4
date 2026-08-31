"use client";

import { useEffect, useState } from "react";
import {
  Zap,
  Droplets,
  Flame,
  Wifi,
  Phone,
  Tv,
  CreditCard,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";
import {
  useBillPayStore,
  type BillCategory,
  type BillProvider,
  type BillPayment,
} from "@/store/billpay/billpay-store";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

const COUNTRIES = [
  { value: "AR", label: "Argentina", flag: "\u{1F1E6}\u{1F1F7}" },
  { value: "BR", label: "Brazil", flag: "\u{1F1E7}\u{1F1F7}" },
  { value: "CO", label: "Colombia", flag: "\u{1F1E8}\u{1F1F4}" },
  { value: "CL", label: "Chile", flag: "\u{1F1E8}\u{1F1F1}" },
  { value: "PE", label: "Peru", flag: "\u{1F1F5}\u{1F1EA}" },
  { value: "MX", label: "Mexico", flag: "\u{1F1F2}\u{1F1FD}" },
];

const CATEGORY_ICONS: Record<string, typeof Zap> = {
  electricity: Zap,
  water: Droplets,
  gas: Flame,
  internet: Wifi,
  phone: Phone,
  tv: Tv,
};

const CATEGORY_LABELS: Record<string, string> = {
  electricity: "Electricity",
  water: "Water",
  gas: "Gas",
  internet: "Internet",
  phone: "Phone",
  tv: "TV / Cable",
};

const DEFAULT_CATEGORIES = [
  { id: "electricity", name: "Electricity" },
  { id: "water", name: "Water" },
  { id: "gas", name: "Gas" },
  { id: "internet", name: "Internet" },
  { id: "phone", name: "Phone" },
  { id: "tv", name: "TV / Cable" },
];

const PAY_CURRENCIES = [
  { value: "USDT", label: "USDT" },
  { value: "USDC", label: "USDC" },
  { value: "BTC", label: "BTC" },
  { value: "ETH", label: "ETH" },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-success/[0.08]", text: "text-success" },
  PROCESSING: { bg: "bg-primary/[0.08]", text: "text-primary" },
  PENDING: { bg: "bg-warning/[0.08]", text: "text-warning" },
  FAILED: { bg: "bg-destructive/[0.08]", text: "text-destructive" },
};

export default function BillPayClient() {
  const { user } = useUserStore();
  const {
    categories,
    payments,
    isLoading,
    isPaying,
    fetchCategories,
    fetchPayments,
    payBill,
  } = useBillPayStore();

  const [selectedCountry, setSelectedCountry] = useState("BR");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<BillProvider | null>(
    null
  );
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [payWithCurrency, setPayWithCurrency] = useState("USDT");

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  useEffect(() => {
    fetchCategories(selectedCountry);
    setSelectedCategory(null);
    setSelectedProvider(null);
  }, [selectedCountry]);

  const displayCategories =
    categories.length > 0
      ? categories
      : DEFAULT_CATEGORIES.map((c) => ({
          ...c,
          icon: c.id,
          providers: [],
        }));

  const currentCategory = categories.find(
    (c) => c.id === selectedCategory || c.name.toLowerCase() === selectedCategory
  );

  const providers = currentCategory?.providers || [];

  const handlePayBill = async () => {
    if (!selectedProvider || !accountNumber || !amount) return;
    const result = await payBill({
      providerId: selectedProvider.id,
      accountNumber,
      amount: parseFloat(amount),
      currency: selectedProvider.country === "BR" ? "BRL" : "USD",
      payWithCurrency,
    });
    if (result.success) {
      setAccountNumber("");
      setAmount("");
      setSelectedProvider(null);
      fetchPayments();
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedProvider(null);
    setAccountNumber("");
    setAmount("");
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const completedPayments = payments.filter((p) => p.status === "COMPLETED");
  const totalPaid = completedPayments.reduce((s, p) => s + p.amount, 0);
  const countryInfo = COUNTRIES.find((c) => c.value === selectedCountry);

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
            Bill Pay
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Pay your bills with crypto — utilities, phone, internet, and more
          </p>
        </div>

        {/* Country Selector */}
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map((country) => (
            <button
              key={country.value}
              onClick={() => setSelectedCountry(country.value)}
              className={`px-4 py-2.5 text-[13px] font-bold border cursor-pointer transition-colors flex items-center gap-2 ${
                selectedCountry === country.value
                  ? "bg-primary/[0.08] border-primary text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <span className="text-[16px]">{country.flag}</span>
              {country.label}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Paid
              </span>
            </div>
            <div className="text-[20px] font-extrabold tabular-nums">
              ${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-success/[0.08]">
                <Check className="w-4 h-4 text-success" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Bills Paid
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {completedPayments.length}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Categories
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {displayCategories.length}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Loader2 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Pending
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {payments.filter((p) => p.status === "PENDING" || p.status === "PROCESSING").length}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">
            {/* Category Grid or Provider List */}
            {!selectedCategory ? (
              <>
                <h2 className="text-[18px] font-bold">
                  Select Bill Category {countryInfo ? `(${countryInfo.flag} ${countryInfo.label})` : ""}
                </h2>
                {isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-card border border-border p-6 animate-pulse">
                        <div className="h-10 bg-muted w-10 mx-auto mb-3" />
                        <div className="h-4 bg-muted w-2/3 mx-auto" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {displayCategories.map((cat) => {
                      const catKey = cat.id?.toLowerCase() || cat.name.toLowerCase();
                      const Icon = CATEGORY_ICONS[catKey] || Zap;
                      const label = CATEGORY_LABELS[catKey] || cat.name;
                      return (
                        <button
                          key={cat.id || cat.name}
                          onClick={() => setSelectedCategory(catKey)}
                          className="bg-card border border-border p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-primary hover:bg-primary/[0.04] transition-colors group"
                        >
                          <div className="w-12 h-12 flex items-center justify-center bg-primary/[0.08] group-hover:bg-primary/[0.12] transition-colors">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <span className="text-[14px] font-bold text-foreground">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Back Button + Category Header */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackToCategories}
                    className="w-8 h-8 flex items-center justify-center bg-card border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-[18px] font-bold">
                    {CATEGORY_LABELS[selectedCategory] || selectedCategory} Providers
                  </h2>
                </div>

                {/* Provider Selection or Payment Form */}
                {!selectedProvider ? (
                  <div className="bg-card border border-border">
                    {providers.length > 0 ? (
                      <div className="divide-y divide-border">
                        {providers.map((provider) => (
                          <button
                            key={provider.id}
                            onClick={() => setSelectedProvider(provider)}
                            className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-muted/50 transition-colors bg-transparent border-none"
                          >
                            <div>
                              <div className="text-[14px] font-bold">
                                {provider.name}
                              </div>
                              <div className="text-[12px] text-muted-foreground mt-0.5">
                                {provider.country} &middot; Min ${provider.minAmount} &middot; Max $
                                {provider.maxAmount?.toLocaleString()}
                              </div>
                            </div>
                            <div className="w-6 h-6 flex items-center justify-center bg-primary/[0.08]">
                              <Zap className="w-3 h-3 text-primary" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-[14px] font-semibold">
                          No providers available
                        </p>
                        <p className="text-[13px] text-muted-foreground mt-1">
                          Providers for this category in{" "}
                          {countryInfo?.label || selectedCountry} are coming soon.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-card border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-[15px] font-extrabold">
                          {selectedProvider.name}
                        </h3>
                        <span className="text-[11px] text-muted-foreground">
                          {CATEGORY_LABELS[selectedCategory] || selectedCategory} &middot;{" "}
                          {selectedProvider.country}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedProvider(null)}
                        className="text-[12px] font-bold text-primary bg-transparent border-none cursor-pointer hover:underline"
                      >
                        Change
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                          Account Number / Customer ID
                        </label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Enter your account or customer number"
                          className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                            Amount
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3.5 py-3 text-lg font-extrabold bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground tabular-nums focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                            Pay With
                          </label>
                          <select
                            value={payWithCurrency}
                            onChange={(e) => setPayWithCurrency(e.target.value)}
                            className="w-full px-3 py-3 text-lg bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground cursor-pointer focus:border-primary focus:outline-none"
                          >
                            {PAY_CURRENCIES.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handlePayBill}
                      disabled={isPaying || !accountNumber || !amount}
                      className="w-full py-3.5 text-[15px] font-extrabold bg-success text-white border-none cursor-pointer mt-5 hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isPaying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Pay Now
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Recent Payments */}
            <div className="mt-6">
              <h2 className="text-[18px] font-bold mb-4">Recent Payments</h2>
              {payments.length > 0 ? (
                <div className="bg-card border border-border overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Date
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Provider
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
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => {
                        const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
                        return (
                          <tr key={p.id} className="border-b border-border last:border-0">
                            <td className="p-3 text-[12px] text-muted-foreground whitespace-nowrap">
                              {formatDate(p.createdAt)}
                            </td>
                            <td className="p-3 text-[13px] font-semibold">
                              {p.providerName}
                            </td>
                            <td className="p-3 text-[12px] text-muted-foreground capitalize">
                              {p.category}
                            </td>
                            <td className="p-3 text-[13px] font-semibold tabular-nums">
                              ${p.amount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              <span className="text-[11px] text-muted-foreground">
                                {p.currency}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${sc.bg} ${sc.text}`}
                              >
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-card border border-border p-8 text-center">
                  <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-[14px] font-semibold">No payments yet</p>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Your bill payment history will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Never Miss a Bill */}
            <div className="bg-primary/[0.06] border border-primary/20 p-4">
              <div className="flex items-start gap-2.5">
                <CreditCard className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-[13px] font-extrabold">
                    Never miss a bill
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Pay your utilities, phone, internet, and cable bills with
                    crypto. Instant confirmation, no bank needed. We handle the
                    conversion and send local currency to your provider.
                  </p>
                </div>
              </div>
            </div>

            {/* Supported Providers */}
            <div className="bg-card border border-border p-4">
              <h3 className="font-extrabold text-sm mb-3">Coverage</h3>
              <div className="flex flex-col gap-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Countries</span>
                  <span className="font-bold">{COUNTRIES.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bill Categories</span>
                  <span className="font-bold">{displayCategories.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Providers</span>
                  <span className="font-bold">
                    {categories.reduce(
                      (sum, c) => sum + (c.providers?.length || 0),
                      0
                    ) || "50+"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Methods</span>
                  <span className="font-bold">{PAY_CURRENCIES.length} cryptos</span>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-card border border-border p-4">
              <h3 className="font-extrabold text-sm mb-4">How It Works</h3>
              <div className="flex flex-col gap-3 text-[13px]">
                {[
                  {
                    icon: Zap,
                    text: "Select your country and bill category",
                  },
                  {
                    icon: CreditCard,
                    text: "Choose your provider and enter account details",
                  },
                  {
                    icon: Check,
                    text: "Pay with your preferred crypto",
                  },
                  {
                    icon: Check,
                    text: "Instant confirmation — bill paid in seconds",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 flex items-center justify-center bg-primary/[0.08] shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <item.icon className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span>{item.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Supported Countries */}
            <div className="bg-card border border-border p-4">
              <h3 className="font-extrabold text-sm mb-3">Available Countries</h3>
              <div className="flex flex-col gap-1.5">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setSelectedCountry(c.value)}
                    className={`flex items-center gap-2.5 p-2 text-left border cursor-pointer transition-colors ${
                      selectedCountry === c.value
                        ? "bg-primary/[0.08] border-primary"
                        : "bg-card border-border hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-[16px]">{c.flag}</span>
                    <span className={`text-[13px] font-semibold ${
                      selectedCountry === c.value ? "text-primary" : ""
                    }`}>
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserDashboardShell>
  );
}
