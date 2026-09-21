"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, Globe2, LockKeyhole, ShieldCheck } from "lucide-react";
import { $fetch } from "@/lib/api";

type CorridorKey = "AR-CO" | "BR-AR" | "BR-CO";
type Corridor = { from: string; fromCode: string; to: string; toCode: string };
type Quote = { id: string; corridor: string; amount: number; fee: number; rate: number; recipientAmount: number; fromCurrency: string; toCurrency: string; provider: string; preview: boolean; expiresAt: string };

const corridors: Record<CorridorKey, Corridor> = {
  "AR-CO": { from: "Argentina", fromCode: "ARS", to: "Colombia", toCode: "COP" },
  "BR-AR": { from: "Brazil", fromCode: "BRL", to: "Argentina", toCode: "ARS" },
  "BR-CO": { from: "Brazil", fromCode: "BRL", to: "Colombia", toCode: "COP" },
};

export default function SendMoneyPage() {
  const [corridorKey, setCorridorKey] = useState<CorridorKey>("AR-CO");
  const [amount, setAmount] = useState("50000");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [showRecipient, setShowRecipient] = useState(false);
  const [recipient, setRecipient] = useState({ name: "", account: "", country: "" });
  const [submitting, setSubmitting] = useState(false);
  const [intent, setIntent] = useState<{ referenceId: string; status: string; provider: string; preview?: boolean } | null>(null);
  const corridor = corridors[corridorKey];

  useEffect(() => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setQuote(null);
      setQuoteError("Enter an amount greater than zero.");
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError("");
      const response = await $fetch<{ data?: Quote }>({ url: `/api/remittance/quote?corridor=${corridorKey}&amount=${numericAmount}`, silent: true });
      if (controller.signal.aborted) return;
      if (response.error || !response.data?.data) {
        setQuote(null);
        setQuoteError(response.error || "This corridor is not available right now.");
      } else {
        setQuote(response.data.data);
      }
      setQuoteLoading(false);
    }, 350);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [amount, corridorKey]);

  const result = quote?.recipientAmount ?? 0;
  const updateRecipient = (field: keyof typeof recipient, value: string) => setRecipient((current) => ({ ...current, [field]: value }));
  const submitIntent = async () => {
    if (!quote || !recipient.name || !recipient.account || !recipient.country) return;
    setSubmitting(true);
    setQuoteError("");
    const response = await $fetch<{ data?: { referenceId: string; status: string; provider: string; preview?: boolean } }>({
      url: "/api/remittance",
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: { quoteId: quote.id, recipient },
    });
    if (response.error || !response.data?.data) setQuoteError(response.error || "We could not create the remittance intent.");
    else setIntent(response.data.data);
    setSubmitting(false);
  };

  const statusLabel = useMemo(() => intent?.preview ? "Preview intent created" : "Remittance intent created", [intent]);

  return <div className="mx-auto max-w-[980px] space-y-5"><div className="text-center"><div className="mb-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#2876b3]"><Globe2 className="h-3.5 w-3.5" /> Cross-border settlement</div><h1 className="text-3xl font-bold tracking-tight text-[#182536]">Send Money</h1><p className="mt-1 text-xs text-[#7a8696]">As easy as sending a text — anywhere in LATAM.</p></div>
    {intent && <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"><p className="font-bold">{statusLabel}</p><p className="mt-1">Reference {intent.referenceId} · Status {intent.status} · Provider {intent.provider}</p></div>}
    <div className="flex flex-wrap items-center justify-center gap-3"><select aria-label="Select corridor" value={corridorKey} onChange={(event) => { setCorridorKey(event.target.value as CorridorKey); setIntent(null); }} className="h-9 rounded-md border border-[#dfe5ec] bg-white px-3 text-xs font-semibold text-[#354154] outline-none"><option value="AR-CO">Argentina → Colombia</option><option value="BR-AR">Brazil → Argentina</option><option value="BR-CO">Brazil → Colombia</option></select><ArrowRight className="h-4 w-4 text-[#2876b3]" /><span className="rounded-md border border-[#dfe5ec] bg-white px-3 py-2 text-xs font-semibold text-[#354154]">{corridor.to}</span></div>
    <section className="rounded-md border border-[#dfe5ec] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"><div className="rounded border border-[#dfe5ec] bg-[#f5f7fa] px-5 py-6 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7d8998]">You send</p><div className="mt-1 flex items-center justify-center gap-3"><span className="text-lg text-[#718094]">$</span><input aria-label="Amount to send" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))} className="w-48 bg-transparent text-center text-4xl font-bold tracking-tight text-[#182536] outline-none" /><span className="text-sm font-bold text-[#718094]">{corridor.fromCode}</span></div><p className="mt-3 text-xs text-[#7d8998]">{quoteLoading ? "Refreshing quote…" : "Recipient gets"}</p><p className="mt-1 text-2xl font-bold text-[#21a86c]">{quote ? `${result.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${quote.toCurrency}` : "—"}</p></div>{quoteError && <p className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">{quoteError}</p>}{quote && <div className="mt-4 divide-y divide-[#edf0f4] rounded border border-[#e4e9ef] bg-white text-xs"><div className="flex justify-between px-4 py-3 text-[#667487]"><span>Exchange rate</span><strong className="text-[#354154]">1 {quote.fromCurrency} = {quote.rate} {quote.toCurrency}</strong></div><div className="flex justify-between px-4 py-3 text-[#667487]"><span>Quatava fee</span><strong className="text-[#21a86c]">{quote.fee ? `${quote.fee} ${quote.fromCurrency}` : "$0.00"}</strong></div><div className="flex justify-between px-4 py-3 text-[#667487]"><span>Estimated delivery</span><strong className="inline-flex items-center gap-1 text-[#354154]"><Clock3 className="h-3.5 w-3.5 text-[#2876b3]" />Under 10 minutes</strong></div></div>}
      {!showRecipient && <button type="button" disabled={!quote || quoteLoading} onClick={() => setShowRecipient(true)} className="mt-4 h-11 w-full rounded-md bg-[#2876b3] text-xs font-bold text-white transition hover:bg-[#1f659b] disabled:cursor-not-allowed disabled:bg-[#aab8c5]">Continue to recipient</button>}
      {showRecipient && !intent && <div className="mt-4 space-y-3 rounded border border-[#e4e9ef] bg-[#fafbfd] p-4"><p className="text-xs font-bold text-[#354154]">Recipient details</p><input aria-label="Recipient name" value={recipient.name} onChange={(event) => updateRecipient("name", event.target.value)} placeholder="Full name" className="h-10 w-full rounded border border-[#dfe5ec] bg-white px-3 text-xs outline-none focus:border-[#68a5d1]" /><input aria-label="Recipient account" value={recipient.account} onChange={(event) => updateRecipient("account", event.target.value)} placeholder="Bank or wallet account" className="h-10 w-full rounded border border-[#dfe5ec] bg-white px-3 text-xs outline-none focus:border-[#68a5d1]" /><input aria-label="Recipient country" value={recipient.country} onChange={(event) => updateRecipient("country", event.target.value)} placeholder="Recipient country" className="h-10 w-full rounded border border-[#dfe5ec] bg-white px-3 text-xs outline-none focus:border-[#68a5d1]" /><button type="button" disabled={submitting || !recipient.name || !recipient.account || !recipient.country} onClick={submitIntent} className="h-11 w-full rounded-md bg-[#2876b3] text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-[#aab8c5]">{submitting ? "Creating secure intent…" : "Create remittance intent"}</button></div>}
    </section>
    <section className="grid gap-3 text-[10px] text-[#718094] sm:grid-cols-3"><div className="flex items-center gap-2 rounded border border-[#e5eaf0] bg-white px-4 py-3"><LockKeyhole className="h-4 w-4 text-[#2876b3]" />Locked quote before confirmation</div><div className="flex items-center gap-2 rounded border border-[#e5eaf0] bg-white px-4 py-3"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Proof of payout included</div><div className="flex items-center gap-2 rounded border border-[#e5eaf0] bg-white px-4 py-3"><ShieldCheck className="h-4 w-4 text-emerald-500" />Transparent exception support</div></section><p className="text-center text-[10px] text-[#8b96a4]">Quotes are provider-backed when configured. Preview mode never dispatches funds to an external settlement provider.</p>
  </div>;
}
