"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Lock,
  Activity,
  TrendingUp,
  RefreshCw,
  DollarSign,
  Image as ImageIcon,
  Lightbulb,
} from "lucide-react";
import Image from "next/image";
import { AnimatedSection } from "@/app/[locale]/components/animated-section";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { tickersWs } from "@/services/tickers-ws";
import { Link } from "@/i18n/routing";
import { useUserStore } from "@/store/user";
import { useTranslations } from "next-intl";
import { MobileAppSection } from "./components/mobile-app-section";
import { getCryptoImageUrl } from "@/utils/image-fallback";
import { useConfigStore } from "@/store/config";
import { $fetch } from "@/lib/api";
import { buildMarketLink } from "@/utils/market-links";

interface PageContent {
  id: string;
  pageId: string;
  pageSource: string;
  type: string;
  title: string;
  variables: Record<string, any>;
  content: string;
  meta: string;
  status: string;
  lastModified: string;
}

const getContent = (pageContent: PageContent | null, path: string, defaultValue: string = "") => {
  if (!pageContent?.variables) return defaultValue;
  const pathParts = path.split('.');
  let value = pageContent.variables;
  for (const part of pathParts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return defaultValue;
    }
  }
  const result = value || defaultValue;
  return result != null ? String(result) : defaultValue;
};

export default function DefaultHomePage() {
  const t = useTranslations("home");
  const [markets, setMarkets] = useState<any[]>([]);
  const [tickers, setTickers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const { user } = useUserStore();
  const { settings } = useConfigStore();

  const isSpotEnabled = settings?.spotWallets === true || settings?.spotWallets === "true";

  useEffect(() => {
    let isMounted = true;
    let hasRun = false;

    const fetchPageContent = async () => {
      if (hasRun || !isMounted) return;
      hasRun = true;
      try {
        const response = await $fetch<PageContent>({
          url: `/api/content/default-page/home`,
          method: "GET",
          params: { pageSource: 'default' },
          silent: true
        });
        if (!isMounted) return;
        if (response.data) setPageContent(response.data);
      } catch (error) {
        if (isMounted) console.error("Error loading page content:", error);
      }
    };

    const timeoutId = setTimeout(() => { fetchPageContent(); }, 0);
    return () => { isMounted = false; hasRun = true; clearTimeout(timeoutId); };
  }, []);

  useEffect(() => {
    let spotUnsubscribe: (() => void) | null = null;

    if (!isSpotEnabled) {
      setIsLoading(false);
      return;
    }

    const fetchMarkets = async () => {
      try {
        setError(null);
        const res = await fetch("/api/exchange/market");
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setMarkets(
          Array.isArray(data)
            ? data.map((market) => ({
                ...market,
                displaySymbol: `${market.currency}/${market.pair}`,
                symbol: `${market.currency}${market.pair}`,
              }))
            : []
        );
      } catch (e) {
        console.error("Error fetching markets:", e);
        setError(e instanceof Error ? e.message : "Failed to fetch markets");
        setMarkets([]);
      } finally {
        setIsLoading(false);
      }
    };

    Promise.resolve()
      .then(() => fetchMarkets())
      .catch((err) => {
        console.error("Unhandled error in fetchMarkets:", err);
        setError("Unexpected error loading markets");
        setIsLoading(false);
      });

    try {
      tickersWs.initialize();
      spotUnsubscribe = tickersWs.subscribeToSpotData((tickers) => {
        setTickers({ ...tickers });
      });
    } catch (wsError) {
      console.error("WebSocket initialization error:", wsError);
    }

    return () => {
      if (spotUnsubscribe) {
        try { spotUnsubscribe(); } catch (e) { console.error("Error during cleanup:", e); }
      }
    };
  }, [isSpotEnabled]);

  const topAssets = useMemo(() => {
    if (!markets.length || !Object.keys(tickers).length) return [];
    try {
      return markets
        .map((market) => {
          const tickerKey = `${market.currency}/${market.pair}`;
          const ticker = tickers[tickerKey] || {};
          const price = Number(ticker.last) || 0;
          const change24h = Number(ticker.change) || 0;
          const volume = Number(ticker.quoteVolume) || 0;
          return {
            name: market.currency,
            symbol: market.symbol,
            ticker: market.currency,
            currency: market.currency,
            pair: market.pair,
            price,
            change24h,
            volume,
          };
        })
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);
    } catch (error) {
      console.error("Error processing top assets:", error);
      return [];
    }
  }, [markets, tickers]);

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    if (volume >= 1) return `$${volume.toFixed(2)}`;
    if (volume > 0) return `$${volume.toFixed(8)}`;
    return `$0.00`;
  };

  if (error) {
    console.warn("Home page error:", error);
  }

  const stats = [
    { value: "$2.4B", label: "Daily trading volume" },
    { value: "3.2M", label: "Active traders worldwide" },
    { value: "180+", label: "Supported crypto assets" },
    { value: "99.9%", label: "Platform uptime" },
  ];

  const features = [
    {
      icon: <Activity className="w-7 h-7" />,
      title: "Spot Trading",
      desc: "Real-time order books, advanced charting with TradingView integration, and institutional-grade execution for 180+ pairs.",
    },
    {
      icon: <TrendingUp className="w-7 h-7" />,
      title: "Futures & Margins",
      desc: "Up to 125x leverage with advanced risk management, real-time liquidation engine, and professional position tracking.",
    },
    {
      icon: <RefreshCw className="w-7 h-7" />,
      title: "Instant Convert",
      desc: "Convert crypto to BRL, ARS, COP, CLP, PEN, MXN, UYU instantly at live market rates — direct to your bank across Latin America.",
    },
    {
      icon: <DollarSign className="w-7 h-7" />,
      title: "Staking & Earn",
      desc: "Earn passive income with competitive APY rates, flexible lock periods, and automated reward distribution across chains.",
    },
    {
      icon: <ImageIcon className="w-7 h-7" />,
      title: "NFT Marketplace",
      desc: "Discover, create, and trade unique digital assets with auction capabilities, creator royalties, and multi-chain support.",
    },
    {
      icon: <Lightbulb className="w-7 h-7" />,
      title: "AI Investment",
      desc: "Machine-learning powered portfolio strategies with backtesting, automated rebalancing, and risk-optimized allocations.",
    },
  ];

  const steps = [
    { num: "01", title: "Create your account", desc: "Sign up in under a minute with email or Web3 wallet. No minimum deposit required." },
    { num: "02", title: "Verify your identity", desc: "Complete KYC verification with our streamlined process — most approvals within 10 minutes." },
    { num: "03", title: "Deposit funds", desc: "Fund your account via bank transfer, card, crypto deposit, or direct purchase. Multiple fiat currencies supported." },
    { num: "04", title: "Start trading", desc: "Access spot, futures, convert, and investment products instantly. Your portfolio, your strategy." },
  ];

  const trustCards = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Multi-layer encryption",
      desc: "End-to-end encryption with cold storage for 95% of assets. SOC 2 Type II compliant infrastructure.",
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "2FA & biometric auth",
      desc: "TOTP, SMS, and email-based two-factor authentication. Biometric login on mobile with FaceID and fingerprint.",
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Real-time monitoring",
      desc: "24/7 fraud detection with machine learning, automated withdrawal limits, and suspicious activity alerts.",
    },
  ];

  return (
    <div className="w-full bg-background text-foreground overflow-hidden">
      {/* HERO */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
          <AnimatedSection>
            <h1 className="font-extrabold text-[clamp(44px,6.5vw,88px)] leading-[clamp(46px,6.8vw,92px)] tracking-[-0.025em] -ml-[0.058em]">
              <span className="block">
                {getContent(pageContent, "hero.title", "Trade smarter.")}
              </span>
              <span className="block text-primary">
                {getContent(pageContent, "hero.subtitle", "Earn more.")}
              </span>
            </h1>
            <p className="text-lg leading-[42px] max-w-[58ch] mt-6 text-muted-foreground">
              {getContent(pageContent, "hero.description", "Quatava is a next-generation cryptocurrency platform for Latin America — spot trading, futures, instant convert to BRL, ARS, COP and more, staking, and AI-powered investments. One account, every market, total control.")}
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href={user ? "/market" : "/register"}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                {user ? "Start Trading" : getContent(pageContent, "hero.cta", "Start Trading")}
              </Link>
              <Link
                href="/market"
                className="inline-flex items-center gap-1 px-4 py-2.5 text-primary font-medium text-sm border border-primary/30 hover:bg-primary/5 transition-colors"
              >
                {getContent(pageContent, "hero.exploreCta", "Explore Markets")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
        <hr className="h-[2px] border-0 bg-border" />
      </div>

      {/* STATS */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
          <AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-4 justify-between gap-6 md:gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <p className="font-extrabold text-[clamp(34px,3.4vw,52px)] leading-[56px] text-primary tracking-[-0.045em] tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-[13px] leading-[14px] tracking-[0.08em] uppercase text-muted-foreground mt-2">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
        <hr className="h-[2px] border-0 bg-border" />
      </div>

      {/* LIVE MARKETS */}
      {isSpotEnabled && (
        <section className="py-12 md:py-16">
          <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
            <AnimatedSection>
              <span className="block text-[13px] leading-[14px] tracking-[0.08em] uppercase text-primary font-medium mb-6">
                {t("live_markets")}
              </span>

              {/* Header row */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 text-[11px] tracking-[0.08em] uppercase text-muted-foreground pb-2 border-b-2 border-border max-sm:grid-cols-[2fr_1fr_1fr] max-sm:[&>:last-child]:hidden">
                <span>Pair</span>
                <span>Price</span>
                <span>24h Change</span>
                <span>Volume</span>
              </div>

              {/* Market rows */}
              <div>
                {isLoading || !topAssets.length ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={`skel-${i}`} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 py-3.5 border-b border-border animate-pulse max-sm:grid-cols-[2fr_1fr_1fr] max-sm:[&>:last-child]:hidden">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-muted" />
                        <div className="h-4 w-28 bg-muted" />
                      </div>
                      <div className="h-4 w-20 bg-muted" />
                      <div className="h-4 w-16 bg-muted" />
                      <div className="h-4 w-16 bg-muted" />
                    </div>
                  ))
                ) : (
                  topAssets.map((asset, i) => (
                    <Link
                      key={asset.symbol}
                      href={buildMarketLink(settings, asset.currency, asset.pair)}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 py-3.5 border-b border-border items-center text-sm tabular-nums cursor-pointer hover:bg-muted/30 transition-colors max-sm:grid-cols-[2fr_1fr_1fr] max-sm:[&>:last-child]:hidden"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 flex items-center justify-center bg-primary/10 overflow-hidden flex-shrink-0">
                            <Image
                              src={getCryptoImageUrl(asset.currency || "generic")}
                              alt={asset.currency}
                              width={20}
                              height={20}
                              className="w-5 h-5 object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.dataset.fallbackAttempted) {
                                  target.dataset.fallbackAttempted = 'true';
                                  target.style.display = 'none';
                                }
                              }}
                            />
                          </div>
                          <span className="font-semibold">
                            {asset.name} / {asset.pair || "USDT"}
                          </span>
                        </div>
                        <span>${formatPrice(asset.price)}</span>
                        <span className={asset.change24h >= 0 ? "text-accent" : "text-destructive"}>
                          {asset.change24h >= 0 ? "+" : ""}{asset.change24h.toFixed(2)}%
                        </span>
                        <span>{formatVolume(asset.volume)}</span>
                      </motion.div>
                    </Link>
                  ))
                )}
              </div>

              <div className="mt-6">
                <Link
                  href="/market"
                  className="inline-flex items-center gap-1 text-primary font-medium text-sm hover:text-primary/80 transition-colors"
                >
                  {t("view_all_markets")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* SUPPORTED CURRENCIES */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
          <AnimatedSection>
            <span className="block text-[13px] leading-[14px] tracking-[0.08em] uppercase text-primary font-medium mb-4">
              Supported Currencies
            </span>
            <h2 className="text-[clamp(22px,2.5vw,30px)] font-extrabold tracking-[-0.02em] mb-8">
              Convert crypto to local fiat across Latin America
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-4">
            {[
              { flag: "\u{1F1E7}\u{1F1F7}", code: "BRL", name: "Brazil" },
              { flag: "\u{1F1E6}\u{1F1F7}", code: "ARS", name: "Argentina" },
              { flag: "\u{1F1E8}\u{1F1F4}", code: "COP", name: "Colombia" },
              { flag: "\u{1F1E8}\u{1F1F1}", code: "CLP", name: "Chile" },
              { flag: "\u{1F1F5}\u{1F1EA}", code: "PEN", name: "Peru" },
              { flag: "\u{1F1F2}\u{1F1FD}", code: "MXN", name: "Mexico" },
              { flag: "\u{1F1FA}\u{1F1FE}", code: "UYU", name: "Uruguay" },
            ].map((c, i) => (
              <motion.div
                key={c.code}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex flex-col items-center gap-2 p-4 border border-border bg-card hover:bg-primary/[0.04] transition-colors"
              >
                <span className="text-3xl">{c.flag}</span>
                <span className="font-extrabold text-sm">{c.code}</span>
                <span className="text-[11px] text-muted-foreground">{c.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
        <hr className="h-[2px] border-0 bg-border" />
      </div>

      {/* FEATURES */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
          <AnimatedSection>
            <span className="block text-[13px] leading-[14px] tracking-[0.08em] uppercase text-primary font-medium mb-4">
              Platform
            </span>
            <h2 className="text-[clamp(28px,3vw,38px)] font-extrabold tracking-[-0.02em] mb-8 md:mb-10">
              {getContent(pageContent, "featuresSection.title", "Everything you need to trade")}
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="p-6 md:p-8 border border-border -mt-px -ml-px flex flex-col gap-3 hover:bg-primary/[0.04] transition-colors"
              >
                <div className="w-10 h-10 flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <h3 className="font-extrabold text-xl tracking-[-0.01em]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-[24px] text-muted-foreground max-w-[42ch]">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
        <hr className="h-[2px] border-0 bg-border" />
      </div>

      {/* HOW IT WORKS */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
          <AnimatedSection>
            <span className="block text-[13px] leading-[14px] tracking-[0.08em] uppercase text-primary font-medium mb-4">
              Getting Started
            </span>
            <h2 className="text-[clamp(28px,3vw,38px)] font-extrabold tracking-[-0.02em] mb-10 md:mb-12">
              Four steps to your first trade
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col gap-3"
              >
                <div className="w-11 h-11 flex items-center justify-center border-2 border-primary font-extrabold text-lg text-primary bg-card">
                  {step.num}
                </div>
                <h3 className="font-extrabold text-[17px] leading-tight">
                  {step.title}
                </h3>
                <p className="text-[13px] leading-[20px] text-muted-foreground">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
        <hr className="h-[2px] border-0 bg-border" />
      </div>

      {/* MOBILE APP PREVIEW */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <AnimatedSection>
              <span className="block text-[13px] leading-[14px] tracking-[0.08em] uppercase text-primary font-medium mb-4">
                Mobile
              </span>
              <h2 className="text-[clamp(28px,3vw,38px)] font-extrabold tracking-[-0.02em] mb-4">
                Trade anywhere.<br />Every feature in your pocket.
              </h2>
              <p className="text-[15px] leading-7 text-muted-foreground max-w-[44ch] mb-8">
                The Quatava mobile app mirrors the full platform — spot trading, portfolio management, instant convert, staking, and real-time alerts. Available on iOS and Android.
              </p>
              <div className="flex gap-3">
                <Link
                  href={user ? "/market" : "/register"}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  Download for iOS
                </Link>
                <Link
                  href={user ? "/market" : "/register"}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-border font-semibold text-sm hover:bg-muted/50 transition-colors"
                >
                  Download for Android
                </Link>
              </div>
            </AnimatedSection>

            {/* Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="w-[280px] h-[560px] border-2 border-border bg-card p-4 flex flex-col">
                {/* Status bar */}
                <div className="flex justify-between text-[11px] font-semibold pb-3">
                  <span>9:41</span>
                  <span className="flex gap-1 items-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
                    <svg width="18" height="10" viewBox="0 0 28 13" fill="currentColor"><rect x="0" y="1" width="23" height="11" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/><rect x="2" y="3" width="16" height="7" rx="0"/><rect x="24" y="4" width="3" height="5" rx="1"/></svg>
                  </span>
                </div>

                {/* Balance */}
                <div className="py-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Total Balance</p>
                  <p className="font-extrabold text-[28px] mt-1">$24,831.40</p>
                  <p className="text-xs text-accent mt-0.5">+$842.30 (3.5%)</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pb-4">
                  <button className="flex-1 py-2 text-[11px] font-extrabold bg-primary text-primary-foreground">Deposit</button>
                  <button className="flex-1 py-2 text-[11px] font-extrabold border border-border">Send</button>
                  <button className="flex-1 py-2 text-[11px] font-extrabold border border-border">Swap</button>
                </div>

                {/* Assets label */}
                <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-2">Assets</p>

                {/* Asset rows */}
                {[
                  { name: "Bitcoin", price: "$67,842" },
                  { name: "Ethereum", price: "$3,521" },
                  { name: "Solana", price: "$178.45" },
                  { name: "Toncoin", price: "$7.82" },
                ].map((a) => (
                  <div key={a.name} className="flex justify-between items-center py-2.5 border-b border-border/50 text-[13px]">
                    <span className="font-semibold">{a.name}</span>
                    <span className="tabular-nums">{a.price}</span>
                  </div>
                ))}

                {/* Bottom nav */}
                <div className="flex justify-around pt-3 mt-auto border-t border-border">
                  {[
                    { label: "Home", active: true },
                    { label: "Trade", active: false },
                    { label: "Convert", active: false },
                    { label: "Wallet", active: false },
                  ].map((nav) => (
                    <div key={nav.label} className={cn("flex flex-col items-center gap-1 text-[9px]", nav.active ? "text-primary" : "text-muted-foreground")}>
                      <div className="w-4 h-4" />
                      {nav.label}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
        <hr className="h-[2px] border-0 bg-border" />
      </div>

      {/* TRUST & SECURITY */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
          <AnimatedSection>
            <span className="block text-[13px] leading-[14px] tracking-[0.08em] uppercase text-primary font-medium mb-4">
              Security
            </span>
            <h2 className="text-[clamp(28px,3vw,38px)] font-extrabold tracking-[-0.02em] mb-8 md:mb-10">
              Built for trust
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trustCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 border border-border bg-card flex flex-col gap-3"
              >
                <div className="text-primary">{card.icon}</div>
                <h3 className="font-extrabold text-[17px]">{card.title}</h3>
                <p className="text-[13px] leading-[20px] text-muted-foreground">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)] py-16 md:py-20">
          <AnimatedSection>
            <h3 className="font-extrabold text-[clamp(36px,4.5vw,60px)] leading-[clamp(38px,4.7vw,63px)] tracking-[-0.02em] -ml-[0.058em]">
              <span className="block">Your money.</span>
              <span className="block">Your markets.</span>
              <span className="block">Your rules.</span>
            </h3>
            <p className="text-[17px] leading-7 mt-6 max-w-[48ch] opacity-90">
              {getContent(pageContent, "cta.description", "Join 3.2 million traders on the platform built for precision, speed, and control. No compromises.")}
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href={user ? "/market" : "/register"}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/50 font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                {user ? "Explore Markets" : getContent(pageContent, "cta.button", "Create free account")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FOOTER */}
      <section className="py-12 md:py-16 text-[13px] leading-7 text-muted-foreground">
        <div className="max-w-[1200px] mx-auto px-5 md:px-[clamp(20px,5vw,72px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8">
            {/* Brand column */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground font-extrabold text-xl">
                  Q
                </div>
                <span className="font-extrabold text-[19px] tracking-[-0.01em] text-foreground">
                  Quatava
                </span>
              </div>
              <p className="max-w-[32ch] text-[13px] text-muted-foreground">
                Next-generation cryptocurrency platform. Trade smarter, earn more.
              </p>
            </div>

            {/* Products */}
            <div>
              <p className="font-extrabold text-[13px] uppercase tracking-[0.06em] text-foreground mb-3">
                Products
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/trade" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">Spot Trading</Link>
                <Link href="/trade" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">Futures</Link>
                <Link href="/convert" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">Convert</Link>
                <Link href="/staking" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">Staking</Link>
                <Link href="/nft" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">NFT Marketplace</Link>
              </div>
            </div>

            {/* Company */}
            <div>
              <p className="font-extrabold text-[13px] uppercase tracking-[0.06em] text-foreground mb-3">
                Company
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">About</Link>
                <Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">Careers</Link>
                <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">Blog</Link>
                <Link href="/press" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">Press</Link>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">Contact</Link>
              </div>
            </div>

            {/* Support */}
            <div>
              <p className="font-extrabold text-[13px] uppercase tracking-[0.06em] text-foreground mb-3">
                Support
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">Help Center</Link>
                <Link href="/api-docs" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">API Docs</Link>
                <Link href="/status" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">Status</Link>
                <Link href="/bug-bounty" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">Bug Bounty</Link>
                <Link href="/legal" className="text-muted-foreground hover:text-primary transition-colors text-[13px]">Legal</Link>
              </div>
            </div>
          </div>

          {/* Footer bottom */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-8 border-t border-border gap-4">
            <span>&copy; {new Date().getFullYear()} Quatava. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
