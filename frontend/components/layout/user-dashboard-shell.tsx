"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTheme } from "next-themes";
import { useUserStore } from "@/store/user";
import {
  Home,
  Wallet,
  Activity,
  TrendingUp,
  RefreshCw,
  DollarSign,
  Image,
  Clock,
  Settings,
  LogOut,
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";

const SIDEBAR_SECTIONS = [
  {
    label: "Main",
    items: [
      { key: "dashboard", title: "Dashboard", href: "/user/dashboard", icon: Home },
      { key: "wallet", title: "Wallet", href: "/finance/wallet", icon: Wallet },
    ],
  },
  {
    label: "Trading",
    items: [
      { key: "spot", title: "Spot Trading", href: "/trade/BTCUSDT", icon: Activity },
      { key: "futures", title: "Futures", href: "/trade/futures", icon: TrendingUp },
      { key: "convert", title: "Convert", href: "/convert", icon: RefreshCw },
    ],
  },
  {
    label: "Invest",
    items: [
      { key: "staking", title: "Staking", href: "/staking", icon: DollarSign },
      { key: "nft", title: "NFT Marketplace", href: "/nft", icon: Image },
      { key: "ai", title: "AI Investment", href: "/ai-investment", icon: Clock },
    ],
  },
  {
    label: "Account",
    items: [
      { key: "settings", title: "Settings", href: "/user/profile", icon: Settings },
      { key: "logout", title: "Log Out", href: "/logout", icon: LogOut },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  const clean = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");
  if (href === "/user/dashboard") return clean === "/user/dashboard" || clean === "/";
  return clean.startsWith(href);
}

function SidebarContent({
  pathname,
  router,
  onNavigate,
}: {
  pathname: string;
  router: ReturnType<typeof useRouter>;
  onNavigate?: () => void;
}) {
  return (
    <>
      {SIDEBAR_SECTIONS.map((section) => (
        <div key={section.label}>
          <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/40 px-4 pt-4 pb-2">
            {section.label}
          </div>
          {section.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <a
                key={item.key}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                  onNavigate?.();
                }}
                className={`flex items-center gap-2.5 py-2.5 px-4 text-[13px] font-semibold no-underline transition-colors ${
                  active
                    ? "text-primary bg-[var(--quatava-blue-100)] dark:bg-[rgba(51,117,187,0.12)] dark:text-[var(--quatava-blue-400)]"
                    : "text-foreground/70 hover:text-foreground hover:bg-primary/5"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {item.title}
              </a>
            );
          })}
        </div>
      ))}
    </>
  );
}

export function UserDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUserStore();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[var(--quatava-bg)]">
      {/* Top Nav — 56px height, matching design spec */}
      <nav className="flex items-center gap-4 h-14 px-[clamp(16px,3vw,32px)] border-b-2 border-border bg-background sticky top-0 z-30">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden w-[34px] h-[34px] flex items-center justify-center bg-transparent border border-border text-foreground cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push("/user/dashboard")}
        >
          <div className="w-[30px] h-[30px] flex items-center justify-center bg-primary text-white font-extrabold text-base">
            Q
          </div>
          <span className="font-extrabold text-[17px] hidden sm:inline">Quatava</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs ml-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search markets, assets, features..."
              className="w-full py-[7px] pl-8 pr-3 text-[13px] bg-card dark:bg-[var(--quatava-input-bg,#21262D)] border border-border text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>

        {/* Right side: theme toggle, notifications, avatar */}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-[34px] h-[34px] flex items-center justify-center bg-transparent border border-border text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button className="w-[34px] h-[34px] flex items-center justify-center bg-transparent border border-border text-foreground cursor-pointer hover:bg-muted/50 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <div className="w-[30px] h-[30px] bg-primary text-white flex items-center justify-center font-extrabold text-[13px] cursor-pointer">
            {initials}
          </div>
        </div>
      </nav>

      {/* Layout: Sidebar + Main */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] min-h-[calc(100vh-56px)]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col gap-1 bg-card dark:bg-[#161B22] border-r border-border py-6">
          <SidebarContent pathname={pathname} router={router} />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed top-14 left-0 bottom-0 w-[280px] bg-card dark:bg-[#161B22] border-r border-border py-6 z-50 lg:hidden overflow-y-auto">
              <SidebarContent
                pathname={pathname}
                router={router}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="overflow-y-auto p-[clamp(16px,3vw,32px)]">{children}</main>
      </div>
    </div>
  );
}
