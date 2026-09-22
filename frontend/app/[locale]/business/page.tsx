import { Link } from "@/i18n/routing";
import { ArrowRight, Building2, Check, Code2, FileText, Link2, ShieldCheck, Users } from "lucide-react";

const products = [
  { icon: Link2, title: "Payment links", description: "Collect payments from clients and customers with a simple shareable link." },
  { icon: FileText, title: "Invoices and reconciliation", description: "Keep invoices, payment status, fees, and exports together for your team." },
  { icon: Users, title: "Team controls", description: "Add teammates with role-based approvals and a clear audit trail." },
  { icon: Code2, title: "API-ready payouts", description: "Prepare for bulk payouts, webhooks, and local-currency settlement." },
];

export default function BusinessPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#182536]">
      <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 lg:py-20">
        <section className="grid gap-10 rounded-[28px] border border-[#dce7ee] bg-white p-7 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div><div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2876b3]"><Building2 className="h-3.5 w-3.5" /> Quatava for business</div><h1 className="max-w-xl text-3xl font-bold tracking-[-0.04em] sm:text-5xl">Move money with the clarity your business deserves.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-[#627184]">A regional business foundation for freelancers, exporters, digital teams, and merchants who need better visibility across payments, wallets, and settlement.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/contact" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2876b3] px-5 text-xs font-bold text-white">Talk to the team <ArrowRight className="h-4 w-4" /></Link><Link href="/register" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dce3ea] px-5 text-xs font-bold text-[#354154]">Create a personal account</Link></div></div>
          <div className="rounded-2xl bg-[#eef8ff] p-6"><div className="flex items-center justify-between"><span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#2876b3]">Business workspace</span><ShieldCheck className="h-5 w-5 text-[#2876b3]" /></div><div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8b96a4]">Settlement</p><p className="mt-2 text-lg font-bold text-[#263548]">Multi-rail</p></div><div className="rounded-xl bg-white p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8b96a4]">Controls</p><p className="mt-2 text-lg font-bold text-[#263548]">Team-ready</p></div></div><p className="mt-5 text-xs leading-6 text-[#627184]">The workspace is designed to grow from payment links into permissions, payouts, API access, and reconciliation.</p></div>
        </section>
        <section className="mt-10 grid gap-4 sm:grid-cols-2">{products.map(({ icon: Icon, title, description }) => <div key={title} className="rounded-2xl border border-[#dfe5ec] bg-white p-6"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf3fb] text-[#2876b3]"><Icon className="h-5 w-5" /></div><h2 className="mt-5 text-base font-bold text-[#263548]">{title}</h2><p className="mt-2 text-xs leading-6 text-[#7a8696]">{description}</p><div className="mt-5 flex items-center gap-2 text-[10px] font-semibold text-[#68778a]"><Check className="h-3.5 w-3.5 text-[#16a05d]" /> Foundation planned into Quatava</div></div>)}</section>
        <p className="mt-8 text-center text-[11px] text-[#8b96a4]">Business availability, settlement rails, and eligibility depend on country, verification, and integration readiness.</p>
      </div>
    </main>
  );
}
