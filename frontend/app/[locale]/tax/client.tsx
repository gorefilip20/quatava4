"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  Building2,
  Calculator,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useTaxStore, type TaxReport } from "@/store/tax/tax-store";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

interface CountryTaxInfo {
  country: string;
  authority: string;
  cryptoTaxRate: string;
  deadline: string;
  code: string;
}

const COUNTRY_TAX_DATA: CountryTaxInfo[] = [
  { country: "Argentina", authority: "AFIP", cryptoTaxRate: "15%", deadline: "June 30", code: "AR" },
  { country: "Brazil", authority: "Receita Federal", cryptoTaxRate: "15-22.5%", deadline: "April 30", code: "BR" },
  { country: "Colombia", authority: "DIAN", cryptoTaxRate: "10%", deadline: "August 9", code: "CO" },
  { country: "Chile", authority: "SII", cryptoTaxRate: "10-40%", deadline: "April 30", code: "CL" },
  { country: "Peru", authority: "SUNAT", cryptoTaxRate: "5-30%", deadline: "March 31", code: "PE" },
  { country: "Mexico", authority: "SAT", cryptoTaxRate: "10-35%", deadline: "April 30", code: "MX" },
];

const YEARS = [2024, 2025, 2026];

function getStatusBadge(status: TaxReport["status"]) {
  switch (status) {
    case "GENERATING":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold uppercase bg-yellow-500/[0.08] text-yellow-600 dark:text-yellow-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Generating
        </span>
      );
    case "READY":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold uppercase bg-success/[0.08] text-success">
          <Check className="w-3 h-3" />
          Ready
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold uppercase bg-red-500/[0.08] text-red-500">
          <AlertCircle className="w-3 h-3" />
          Failed
        </span>
      );
  }
}

export default function TaxClient() {
  const { user } = useUserStore();
  const {
    reports,
    summary,
    isLoading,
    isGenerating,
    fetchReports,
    fetchSummary,
    generateReport,
  } = useTaxStore();

  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedCountry, setSelectedCountry] = useState("BR");
  const [selectedFormat, setSelectedFormat] = useState<"PDF" | "CSV">("PDF");
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchReports();
      fetchSummary(selectedYear);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSummary(selectedYear);
    }
  }, [selectedYear]);

  const handleGenerate = async () => {
    const countryName = COUNTRY_TAX_DATA.find((c) => c.code === selectedCountry)?.country || selectedCountry;
    await generateReport({
      year: selectedYear,
      country: countryName,
      format: selectedFormat,
    });
  };

  const handleDownload = (report: TaxReport) => {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, "_blank");
    }
  };

  const formatCurrency = (val: number) =>
    val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const netGains = summary?.netGain ?? 0;
  const totalTx = summary?.transactionCount ?? 0;
  const estimatedTax = netGains > 0 ? netGains * 0.15 : 0;

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
            Tax Reports
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            One-click tax reports compliant with your country's regulations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Calculator className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Net Capital Gains
              </span>
            </div>
            <div className={`text-[20px] font-extrabold ${netGains >= 0 ? "text-success" : "text-red-500"}`}>
              {netGains >= 0 ? "+" : ""}${formatCurrency(netGains)}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Transactions
              </span>
            </div>
            <div className="text-[20px] font-extrabold">{totalTx}</div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-orange-500/[0.08]">
                <AlertCircle className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Estimated Tax
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-orange-500">
              ${formatCurrency(estimatedTax)}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-success/[0.08]">
                <Check className="w-4 h-4 text-success" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Reports Generated
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-success">
              {reports.filter((r) => r.status === "READY").length}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Tax Summary */}
            {summary && (
              <div className="bg-card border border-border p-5">
                <h2 className="text-[18px] font-bold mb-4">
                  {selectedYear} Tax Summary
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1">
                      Total Gains
                    </span>
                    <div className="text-[18px] font-extrabold text-success">
                      +${formatCurrency(summary.totalRealizedGains)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1">
                      Total Losses
                    </span>
                    <div className="text-[18px] font-extrabold text-red-500">
                      -${formatCurrency(summary.totalRealizedLosses)}
                    </div>
                  </div>
                </div>

                {summary.topGains.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-2">
                      Top Gaining Assets
                    </span>
                    <div className="space-y-1.5">
                      {summary.topGains.map((item) => (
                        <div key={item.asset} className="flex items-center justify-between">
                          <span className="text-[13px] font-semibold">{item.asset}</span>
                          <span className="text-[13px] font-bold text-success">
                            +${formatCurrency(item.gain)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summary.topLosses.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-2">
                      Top Losing Assets
                    </span>
                    <div className="space-y-1.5">
                      {summary.topLosses.map((item) => (
                        <div key={item.asset} className="flex items-center justify-between">
                          <span className="text-[13px] font-semibold">{item.asset}</span>
                          <span className="text-[13px] font-bold text-red-500">
                            -${formatCurrency(item.loss)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reports List */}
            <div className="bg-card border border-border p-5">
              <h2 className="text-[18px] font-bold mb-4">Your Reports</h2>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-5 bg-muted w-1/3 mb-2" />
                      <div className="h-4 bg-muted w-2/3" />
                    </div>
                  ))}
                </div>
              ) : reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 flex items-center justify-center bg-primary/[0.08]">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-[13px] font-bold">
                            {report.country} - {report.year}
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(report.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(report.status)}
                        {report.status === "READY" && (
                          <button
                            onClick={() => handleDownload(report)}
                            className="w-8 h-8 flex items-center justify-center bg-primary/[0.08] text-primary hover:bg-primary/[0.16] transition-colors border-0 cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-[13px] text-muted-foreground font-semibold">
                    No reports yet
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Generate your first tax report using the form
                  </p>
                </div>
              )}
            </div>

            {/* Country Tax Info Cards */}
            <div className="bg-card border border-border p-5">
              <h2 className="text-[18px] font-bold mb-4">
                Tax Regulations by Country
              </h2>
              <div className="space-y-2">
                {COUNTRY_TAX_DATA.map((info) => (
                  <div key={info.code} className="border border-border">
                    <button
                      onClick={() =>
                        setExpandedCountry(expandedCountry === info.code ? null : info.code)
                      }
                      className="w-full flex items-center justify-between p-3 bg-transparent text-foreground border-0 cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="text-[13px] font-bold">{info.country}</span>
                        <span className="text-[11px] text-muted-foreground">
                          ({info.authority})
                        </span>
                      </div>
                      <svg
                        className={`w-4 h-4 text-muted-foreground transition-transform ${
                          expandedCountry === info.code ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="square" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {expandedCountry === info.code && (
                      <div className="px-3 pb-3 space-y-2 border-t border-border pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-muted-foreground">
                            Tax Authority
                          </span>
                          <span className="text-[12px] font-bold">{info.authority}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-muted-foreground">
                            Crypto Tax Rate
                          </span>
                          <span className="text-[12px] font-bold">{info.cryptoTaxRate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-muted-foreground">
                            Reporting Deadline
                          </span>
                          <span className="text-[12px] font-bold">{info.deadline}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Generate Report Form */}
            <div className="bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-[15px] font-bold">Generate Report</h3>
              </div>

              {/* Year Selector */}
              <div className="mb-4">
                <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-2">
                  Tax Year
                </span>
                <div className="flex gap-2">
                  {YEARS.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`flex-1 py-2 text-[13px] font-bold border cursor-pointer transition-colors ${
                        selectedYear === year
                          ? "bg-primary text-white border-primary"
                          : "bg-card text-foreground border-border hover:bg-muted/30"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country Selector */}
              <div className="mb-4">
                <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-2">
                  Country
                </span>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full py-2.5 px-3 text-[13px] bg-card border border-border text-foreground outline-none cursor-pointer"
                >
                  {COUNTRY_TAX_DATA.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.country} ({c.authority})
                    </option>
                  ))}
                </select>
              </div>

              {/* Format Selector */}
              <div className="mb-4">
                <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-2">
                  Format
                </span>
                <div className="flex gap-2">
                  {(["PDF", "CSV"] as const).map((fmt) => (
                    <label
                      key={fmt}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-bold border cursor-pointer transition-colors ${
                        selectedFormat === fmt
                          ? "bg-primary text-white border-primary"
                          : "bg-card text-foreground border-border hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={fmt}
                        checked={selectedFormat === fmt}
                        onChange={() => setSelectedFormat(fmt)}
                        className="sr-only"
                      />
                      {fmt}
                    </label>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-2.5 bg-primary text-white text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate Report
                  </>
                )}
              </button>
            </div>

            {/* Why Tax Reports Matter */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[15px] font-bold mb-3">
                Why Tax Reports Matter
              </h3>
              <div className="space-y-3">
                {[
                  {
                    icon: Building2,
                    title: "Stay Compliant",
                    desc: "Avoid penalties by reporting crypto gains accurately",
                  },
                  {
                    icon: Calculator,
                    title: "Optimize Taxes",
                    desc: "Offset gains with losses to reduce your tax bill",
                  },
                  {
                    icon: Calendar,
                    title: "Never Miss Deadlines",
                    desc: "Country-specific reminders for filing dates",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08] shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold">{item.title}</h4>
                        <p className="text-[11px] text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deadline Reminders */}
            <div className="bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-orange-500" />
                <h3 className="text-[15px] font-bold">Upcoming Deadlines</h3>
              </div>
              <div className="space-y-2">
                {COUNTRY_TAX_DATA.map((info) => (
                  <div
                    key={info.code}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="text-[12px] font-semibold">{info.country}</span>
                    <span className="text-[12px] font-bold text-orange-500">
                      {info.deadline}
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
