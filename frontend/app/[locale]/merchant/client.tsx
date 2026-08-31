"use client";

import { useEffect, useState } from "react";
import {
  Store,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  RefreshCw,
  Globe,
  DollarSign,
  Shield,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";
import { useMerchantStore } from "@/store/merchant/merchant-store";
import { useUserStore } from "@/store/user";

const BUSINESS_TYPES = [
  "E-Commerce",
  "SaaS",
  "Marketplace",
  "Freelance",
  "Restaurant",
  "Retail",
  "Other",
];

const SETTLEMENT_CURRENCIES = ["USD", "BRL", "ARS", "COP", "CLP", "PEN", "MXN"];

export default function MerchantClient() {
  const { user } = useUserStore();
  const {
    profile,
    transactions,
    isLoading,
    isSaving,
    fetchProfile,
    fetchTransactions,
    createProfile,
    updateProfile,
    regenerateKeys,
  } = useMerchantStore();

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("E-Commerce");
  const [website, setWebsite] = useState("");
  const [settlementCurrency, setSettlementCurrency] = useState("USD");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "integration" | "transactions">("overview");

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setWebhookUrl(profile.webhookUrl || "");
    }
  }, [profile]);

  const handleCreate = async () => {
    if (!businessName) return;
    await createProfile({
      businessName,
      businessType,
      website: website || undefined,
      settlementCurrency,
    });
  };

  const handleSaveWebhook = async () => {
    if (!profile) return;
    await updateProfile({ webhookUrl });
  };

  const handleToggleAutoSettle = async () => {
    if (!profile) return;
    await updateProfile({ autoSettle: !profile.autoSettle });
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await regenerateKeys();
    setIsRegenerating(false);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "SETTLED":
        return "bg-success/[0.08] text-success";
      case "PENDING":
        return "bg-[#F59E0B]/[0.08] text-[#F59E0B]";
      case "EXPIRED":
      case "REFUNDED":
        return "bg-destructive/[0.08] text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <UserDashboardShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </UserDashboardShell>
    );
  }

  if (!profile) {
    return (
      <UserDashboardShell>
        <div className="space-y-6 max-w-xl mx-auto py-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary/[0.08]">
              <Store className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">Merchant Gateway</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Accept crypto payments from customers worldwide. They pay in crypto, you receive local currency.
            </p>
          </div>

          <div className="bg-card border border-border p-6 space-y-5">
            <h2 className="font-bold text-[16px]">Set Up Your Business</h2>
            <div>
              <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your business name"
                className="w-full py-2 px-3 text-[13px] bg-card border border-border text-foreground outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1">
                Business Type
              </label>
              <div className="flex gap-2 flex-wrap">
                {BUSINESS_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setBusinessType(t)}
                    className={`px-3 py-1.5 text-[12px] font-semibold border cursor-pointer transition-colors ${
                      businessType === t
                        ? "bg-primary text-white border-primary"
                        : "bg-card border-border hover:bg-primary/[0.05]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1">
                Website (Optional)
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yoursite.com"
                className="w-full py-2 px-3 text-[13px] bg-card border border-border text-foreground outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1">
                Settlement Currency
              </label>
              <div className="flex gap-2 flex-wrap">
                {SETTLEMENT_CURRENCIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSettlementCurrency(c)}
                    className={`px-3 py-1.5 text-[12px] font-semibold border cursor-pointer transition-colors ${
                      settlementCurrency === c
                        ? "bg-primary text-white border-primary"
                        : "bg-card border-border hover:bg-primary/[0.05]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={isSaving || !businessName}
              className="w-full py-3 bg-primary text-white text-[14px] font-bold cursor-pointer border-0 disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Merchant Account"
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Zap, title: "Instant Payments", desc: "Customers pay in BTC, ETH, USDT or any crypto" },
              { icon: Shield, title: "Auto Settlement", desc: "Receive local currency directly in your bank" },
              { icon: Globe, title: "Global Reach", desc: "Accept payments from 100+ countries" },
            ].map((f) => (
              <div key={f.title} className="bg-card border border-border p-4 text-center">
                <f.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-bold text-[13px]">{f.title}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </UserDashboardShell>
    );
  }

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">Merchant Gateway</h1>
            <p className="text-[13px] text-muted-foreground mt-1">{profile.businessName}</p>
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${
              profile.status === "ACTIVE"
                ? "bg-success/[0.08] text-success"
                : profile.status === "PENDING"
                ? "bg-[#F59E0B]/[0.08] text-[#F59E0B]"
                : "bg-destructive/[0.08] text-destructive"
            }`}
          >
            {profile.status}
          </span>
        </div>

        <div className="flex gap-1 border-b border-border">
          {(["overview", "integration", "transactions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-[13px] font-semibold cursor-pointer border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Received", value: `$${profile.totalReceived.toLocaleString()}`, icon: DollarSign, trend: "+12.4%" },
                  { label: "Transactions", value: profile.totalTransactions.toLocaleString(), icon: ArrowUpRight, trend: "+8" },
                  { label: "Settlement", value: profile.settlementCurrency, icon: Globe, trend: profile.autoSettle ? "Auto" : "Manual" },
                  { label: "Business Type", value: profile.businessType, icon: Store, trend: "" },
                ].map((s) => (
                  <div key={s.label} className="bg-card border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <s.icon className="w-4 h-4 text-primary" />
                      {s.trend && (
                        <span className="text-[11px] font-semibold text-success flex items-center gap-0.5">
                          <ArrowUpRight className="w-3 h-3" />
                          {s.trend}
                        </span>
                      )}
                    </div>
                    <div className="text-[20px] font-extrabold">{s.value}</div>
                    <div className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold mt-1">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border p-5 space-y-4">
                <h3 className="font-bold text-[14px]">Recent Transactions</h3>
                {transactions.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground py-4 text-center">
                    No transactions yet. Share your payment link to start receiving payments.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">Order</th>
                          <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">Amount</th>
                          <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">Crypto</th>
                          <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">Status</th>
                          <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 10).map((tx) => (
                          <tr key={tx.id} className="border-b border-border last:border-0">
                            <td className="p-3 text-[13px] font-semibold">{tx.orderId}</td>
                            <td className="p-3 text-[13px]">${tx.amount.toLocaleString()} {tx.currency}</td>
                            <td className="p-3 text-[13px]">{tx.cryptoAmount} {tx.cryptoCurrency}</td>
                            <td className="p-3"><span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${statusColor(tx.status)}`}>{tx.status}</span></td>
                            <td className="p-3 text-[13px] text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card border border-border p-4">
                <h3 className="font-extrabold text-sm mb-3">Settings</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold">Auto Settlement</div>
                    <div className="text-[11px] text-muted-foreground">Convert to {profile.settlementCurrency} automatically</div>
                  </div>
                  <button
                    onClick={handleToggleAutoSettle}
                    className={`w-10 h-5 flex items-center cursor-pointer border-0 transition-colors ${
                      profile.autoSettle ? "bg-success justify-end" : "bg-border justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 bg-white mx-0.5" />
                  </button>
                </div>
              </div>

              <div className="bg-card border border-border p-4">
                <h3 className="font-extrabold text-sm mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { icon: ExternalLink, text: "View payment page" },
                    { icon: Key, text: "API documentation" },
                    { icon: Globe, text: "Embed checkout widget" },
                  ].map((item, i) => (
                    <button
                      key={i}
                      className="w-full flex items-center gap-2.5 p-3 bg-card border border-border text-[13px] font-semibold cursor-pointer hover:bg-primary/[0.05] transition-colors text-left"
                    >
                      <item.icon className="w-4 h-4 text-primary" />
                      {item.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "integration" && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-card border border-border p-5 space-y-4">
              <h3 className="font-bold text-[14px]">API Keys</h3>
              <p className="text-[13px] text-muted-foreground">Use these keys to integrate Quatava payments into your application.</p>

              <div>
                <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1">API Key</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 py-2 px-3 text-[13px] bg-card border border-border text-foreground font-mono break-all">{profile.apiKey}</div>
                  <button onClick={() => copyToClipboard(profile.apiKey, "api")} className="w-9 h-9 flex items-center justify-center border border-border bg-card cursor-pointer hover:bg-primary/[0.05]">
                    {copiedField === "api" ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1">Secret Key</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 py-2 px-3 text-[13px] bg-card border border-border text-foreground font-mono break-all">
                    {showSecret ? profile.secretKey : "••••••••••••••••••••••••"}
                  </div>
                  <button onClick={() => setShowSecret(!showSecret)} className="w-9 h-9 flex items-center justify-center border border-border bg-card cursor-pointer hover:bg-primary/[0.05]">
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => copyToClipboard(profile.secretKey, "secret")} className="w-9 h-9 flex items-center justify-center border border-border bg-card cursor-pointer hover:bg-primary/[0.05]">
                    {copiedField === "secret" ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold border border-destructive text-destructive bg-card cursor-pointer hover:bg-destructive/[0.05] transition-colors disabled:opacity-50"
              >
                {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Regenerate Keys
              </button>
            </div>

            <div className="bg-card border border-border p-5 space-y-4">
              <h3 className="font-bold text-[14px]">Webhook URL</h3>
              <p className="text-[13px] text-muted-foreground">We will POST payment events to this URL in real time.</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://yoursite.com/api/webhooks/quatava"
                  className="flex-1 py-2 px-3 text-[13px] bg-card border border-border text-foreground outline-none"
                />
                <button
                  onClick={handleSaveWebhook}
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary text-white text-[13px] font-bold cursor-pointer border-0 disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </button>
              </div>
            </div>

            <div className="bg-card border border-border p-5 space-y-4">
              <h3 className="font-bold text-[14px]">Quick Integration</h3>
              <p className="text-[13px] text-muted-foreground">Copy this snippet to add a Quatava payment button to your site.</p>
              <div className="bg-[#0D1117] p-4 overflow-x-auto">
                <pre className="text-[12px] text-[#E6EDF3] font-mono whitespace-pre">{`<script src="https://pay.quatava.com/embed.js"><\/script>
<div
  id="quatava-pay"
  data-merchant="${profile.apiKey.slice(0, 8)}..."
  data-amount="29.99"
  data-currency="USD"
><\/div>`}</pre>
              </div>
              <button
                onClick={() => copyToClipboard(`<script src="https://pay.quatava.com/embed.js"></script>\n<div id="quatava-pay" data-merchant="${profile.apiKey}" data-amount="29.99" data-currency="USD"></div>`, "snippet")}
                className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold border border-border bg-card cursor-pointer hover:bg-primary/[0.05]"
              >
                {copiedField === "snippet" ? <><Check className="w-4 h-4 text-success" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Snippet</>}
              </button>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="bg-card border border-border overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="py-12 text-center">
                <Store className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-[14px] font-semibold">No transactions yet</p>
                <p className="text-[13px] text-muted-foreground mt-1">Transactions will appear here once customers start paying.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">Order ID</th>
                    <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">Customer</th>
                    <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">Amount</th>
                    <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">Crypto</th>
                    <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">Settled</th>
                    <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">Status</th>
                    <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border last:border-0">
                      <td className="p-3 text-[13px] font-semibold font-mono">{tx.orderId}</td>
                      <td className="p-3 text-[13px]">{tx.customerEmail || "—"}</td>
                      <td className="p-3 text-[13px]">${tx.amount.toLocaleString()} {tx.currency}</td>
                      <td className="p-3 text-[13px]">{tx.cryptoAmount} {tx.cryptoCurrency}</td>
                      <td className="p-3 text-[13px]">
                        {tx.settled ? (
                          <span className="flex items-center gap-1 text-success"><Check className="w-3.5 h-3.5" />${tx.settledAmount?.toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">Pending</span>
                        )}
                      </td>
                      <td className="p-3"><span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${statusColor(tx.status)}`}>{tx.status}</span></td>
                      <td className="p-3 text-[13px] text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </UserDashboardShell>
  );
}
