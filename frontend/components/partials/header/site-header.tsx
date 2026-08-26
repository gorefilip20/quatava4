"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Moon, Settings, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { NotificationBell } from "./notification-bell";
import { Link, usePathname } from "@/i18n/routing";
import { useMediaQuery } from "@/hooks/use-media-query";
import MainMenu from "./horizontal-menu";
import { AuthHeaderControls } from "@/components/auth/auth-header-controls";
import { useUserStore } from "@/store/user";
import { useConfigStore } from "@/store/config";
import LanguageSelector from "./language-selector";
import { useTranslations } from "next-intl";
import MobileMenuHandler from "./mobile-menu-handler";
import MobileSidebar from "@/components/partials/sidebar";
import CustomMobileMenu from "./custom-mobile-menu";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Quatava";
const defaultTheme = process.env.NEXT_PUBLIC_DEFAULT_THEME || "dark";

interface SiteHeaderProps {
  menu?: "user" | MenuItem[];
  rightControls?: React.ReactNode;
  title?: string;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  menu = "user",
  rightControls,
  title,
}) => {
  const t = useTranslations("components/partials/header/site-header");
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, hasPermission } = useUserStore();
  const { settings } = useConfigStore();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const layoutSwitcherEnabled = settings?.layoutSwitcher === true || settings?.layoutSwitcher === "true";
  const isCustomMenu = Array.isArray(menu);
  const isInAdminArea = pathname.startsWith("/admin");
  const isDark = mounted ? resolvedTheme === "dark" : true;
  const mediaQueryDesktop = useMediaQuery("(min-width: 1280px)");
  const isDesktop = mounted && mediaQueryDesktop;
  const backButtonHref = isInAdminArea ? "/admin" : "/";
  const userEquivalentPath = isInAdminArea ? pathname.replace("/admin", "") || "/" : "/admin";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !layoutSwitcherEnabled && theme !== defaultTheme) setTheme(defaultTheme);
  }, [mounted, layoutSwitcherEnabled, theme, setTheme]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
          isScrolled
            ? "border-white/[0.08] bg-[#07090d]/92 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-2xl"
            : "border-transparent bg-[#07090d]/55 backdrop-blur-xl",
        )}
      >
        <div className="mx-auto flex h-[72px] max-w-[1360px] items-center justify-between gap-5 px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-4 xl:gap-9">
            {!isDesktop && <MobileMenuHandler />}
            {isCustomMenu && isInAdminArea && (
              <Link href={backButtonHref} className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            )}
            <Link href="/" className="group flex shrink-0 items-center gap-2.5">
              <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] bg-[#39e29b] text-[#06110d] shadow-[0_0_22px_rgba(57,226,155,0.22)] transition group-hover:scale-105">
                <span className="absolute h-5 w-5 rotate-45 rounded-[5px] border-[3px] border-[#06110d]" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-[#06110d]" />
              </span>
              <span className="hidden text-[15px] font-semibold tracking-[-0.03em] text-white sm:inline">{siteName}</span>
              {title && <span className="hidden border-l border-white/10 pl-4 text-xs text-slate-500 lg:inline">{title}</span>}
            </Link>
            {isDesktop && !isCustomMenu && <div className="h-6 w-px bg-white/[0.09]" />}
            {isDesktop && <div className="min-w-0"><MainMenu menu={menu} /></div>}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {rightControls && <div className="hidden items-center lg:flex">{rightControls}</div>}
            {hasPermission("access.admin") && (
              <Link href={userEquivalentPath} className="hidden items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white sm:flex">
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">{isInAdminArea ? t("User") : t("Admin")}</span>
              </Link>
            )}
            <div className="hidden md:block"><LanguageSelector variant="compact" /></div>
            {layoutSwitcherEnabled && (
              <button type="button" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="hidden h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.06] hover:text-white md:flex">
                <AnimatePresence mode="wait" initial={false}>
                  {isDark ? <motion.span key="sun" initial={{ opacity: 0, rotate: -45 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 45 }}><Sun className="h-4 w-4" /></motion.span> : <motion.span key="moon" initial={{ opacity: 0, rotate: 45 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -45 }}><Moon className="h-4 w-4" /></motion.span>}
                </AnimatePresence>
              </button>
            )}
            {user && <div className="hidden md:block"><NotificationBell /></div>}
            <AuthHeaderControls />
          </div>
        </div>
      </motion.header>
      {isCustomMenu && isInAdminArea ? <CustomMobileMenu menu={menu} siteName={siteName} /> : <MobileSidebar menu={menu} />}
    </>
  );
};

export default SiteHeader;
