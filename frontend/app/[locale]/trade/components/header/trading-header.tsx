"use client";

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Star,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Save,
  Moon,
  Sun,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useLayout } from "../layout/layout-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Symbol } from "@/store/trade/use-binary-store";
import { wishlistService } from "@/services/wishlist-service";
import { marketDataWs, type TickerData } from "@/services/market-data-ws";
import { useTranslations } from "next-intl";

export default function TradingHeader({
  currentSymbol,
  onSymbolChange,
  marketType = "spot",
}: {
  currentSymbol?: Symbol;
  onSymbolChange?: (symbol: Symbol) => void;
  marketType?: "spot" | "futures" | "eco";
}) {
  const t = useTranslations("trade/components/header/trading-header");
  const router = useRouter();
  const [price, setPrice] = useState("Loading...");
  const [priceChange, setPriceChange] = useState("0.00%");
  const [isPositive, setIsPositive] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [precision, setPrecision] = useState(2);
  const [volume, setVolume] = useState("--");

  const [isFavorite, setIsFavorite] = useState(false);
  const [displaySymbol, setDisplaySymbol] = useState("");
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const { theme, setTheme } = useTheme();

  // Add safe destructuring with default values
  const {
    layoutConfig = {
      leftPanel: 20,
      centerPanel: 60,
      rightPanel: 20,
      topPanel: 0,
      bottomPanel: 20,
      chartPanel: 70,
      dataPanel: 30,
      panels: {},
      panelGroups: {},
    },
    currentPreset = "",
    layoutPresets = {},
    applyPreset = () => {},
    addLayoutPreset = () => {},
  } = useLayout() || {};

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");



  // Format price with appropriate precision
  const formatPrice = (price: number, precision = 2): string => {
    if (typeof price !== "number") return "Loading...";

    return price.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  };

  // Format display symbol
  const getDisplaySymbol = (symbol: Symbol) => {
    // Handle delimiter-based formats first: BTC/USDT, BTC-USDT, BTC_USDT
    if (symbol.includes("/")) {
      return symbol; // Already in display format
    }
    if (symbol.includes("-")) {
      return symbol.replace("-", "/");
    }
    if (symbol.includes("_")) {
      return symbol.replace("_", "/");
    }

    // For symbols without delimiters (like BTCUSDT), split intelligently
    const midPoint = Math.floor(symbol.length / 2);
    
    // Try different split points around the middle to find a reasonable split
    for (let i = Math.max(2, midPoint - 2); i <= Math.min(symbol.length - 2, midPoint + 2); i++) {
      const base = symbol.substring(0, i);
      const quote = symbol.substring(i);
      
      // Prefer splits where quote is 3-4 characters (common for crypto quotes)
      if (quote.length >= 3 && quote.length <= 4) {
        return `${base}/${quote}`;
      }
    }

    // Fallback: split at midpoint
    const currency = symbol.substring(0, midPoint);
    const pair = symbol.substring(midPoint);
    return `${currency}/${pair}`;
  };

  // Format volume for display (K, M, B)
  const formatVolume = (volume: number | string): string => {
    // Convert string to number if needed
    const numVolume =
      typeof volume === "string" ? Number.parseFloat(volume) : volume;

    if (isNaN(numVolume)) return "--";

    if (numVolume >= 1_000_000_000) {
      return `${(numVolume / 1_000_000_000).toFixed(1)}B`;
    } else if (numVolume >= 1_000_000) {
      return `${(numVolume / 1_000_000).toFixed(1)}M`;
    } else if (numVolume >= 1_000) {
      return `${(numVolume / 1_000).toFixed(1)}K`;
    }
    return `${numVolume.toFixed(0)}`;
  };

  // Update display symbol when current symbol changes
  useEffect(() => {
    if (currentSymbol) {
      setDisplaySymbol(getDisplaySymbol(currentSymbol));
    } else {
      setDisplaySymbol("BTC/USDT"); // Default display if no symbol is provided
    }
  }, [currentSymbol]);

  // Handle ticker data updates from the market data WebSocket service
  const handleTickerUpdate = useCallback(
    (data: TickerData) => {
      if (!currentSymbol || !data) {
        return;
      }

      // Get price and apply precision
      if (data.last !== undefined) {
        const formattedPrice = formatPrice(data.last, precision);
        setPrice(formattedPrice);
      }

      // Handle price change percentage - use percentage field if available, otherwise calculate
      if (data.percentage !== undefined) {
        const changePercent = `${data.percentage >= 0 ? "+" : ""}${data.percentage.toFixed(2)}%`;
        setPriceChange(changePercent);
        setIsPositive(data.percentage >= 0);
      } else if (data.change !== undefined && data.last !== undefined) {
        // Calculate percentage from absolute change and current price
        const percentage = (data.change / (data.last - data.change)) * 100;
        const changePercent = `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`;
        setPriceChange(changePercent);
        setIsPositive(percentage >= 0);
      }

      // Handle volume (use quoteVolume if available)
      if (data.quoteVolume !== undefined) {
        const formattedVolume = data.quoteVolume > 1000000
          ? `${(data.quoteVolume / 1000000).toFixed(1)}M`
          : data.quoteVolume > 1000
          ? `${(data.quoteVolume / 1000).toFixed(1)}K`
          : data.quoteVolume.toFixed(0);
        setVolume(formattedVolume);
      } else if (data.baseVolume !== undefined) {
        // Fallback to baseVolume if quoteVolume is not available
        const formattedVolume = data.baseVolume > 1000000
          ? `${(data.baseVolume / 1000000).toFixed(1)}M`
          : data.baseVolume > 1000
          ? `${(data.baseVolume / 1000).toFixed(1)}K`
          : data.baseVolume.toFixed(0);
        setVolume(formattedVolume);
      }

      // Note: 'high' property doesn't exist in TickerData type
      // Would need to be added to the type definition if needed
    },
    [currentSymbol, precision]
  );

  // Subscribe to market data based on market type
  useEffect(() => {
    if (!mounted || !currentSymbol) return;

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Reset price display when subscribing to new symbol
    // This will be updated immediately when ticker data arrives
    setPrice("Loading...");
    setPriceChange("+0.00%");
    setVolume("--");

    // Subscribe to ticker data using marketType directly
    const unsubscribe = marketDataWs.subscribe<TickerData>(
      {
        symbol: currentSymbol,
        type: "ticker",
        marketType: marketType,
      },
      handleTickerUpdate
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [currentSymbol, marketType, mounted]);

  // Check if the current symbol is in the wishlist
  useEffect(() => {
    if (!currentSymbol) return;

    const unsubscribe = wishlistService.subscribe((wishlist) => {
      setIsFavorite(wishlist.some((item) => item.symbol === currentSymbol));
    });

    return () => unsubscribe();
  }, [currentSymbol]);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
    return () => {
      // Cleanup
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Handle layout preset selection
  const handlePresetSelect = (preset: string) => {
    console.log(`Selected preset: ${preset}`);
    applyPreset(preset);
  };

  // Handle save layout
  const handleSaveLayout = () => {
    if (newPresetName.trim() === "") return;

    addLayoutPreset(newPresetName, layoutConfig);
    setSaveDialogOpen(false);
    setNewPresetName("");
  };

  // Toggle favorite status
  const toggleFavorite = () => {
    if (currentSymbol) {
      wishlistService.toggleWishlist(currentSymbol);
    }
  };

  // Handle back to home navigation
  const handleBackToHome = () => {
    router.push("/");
  };

  if (!mounted) return null;

  // Ensure layoutPresets is an object before using Object.keys
  const presetKeys = layoutPresets ? Object.keys(layoutPresets) : [];

  return (
    <div className="flex items-center gap-4 px-3 py-2 border-b-2 border-border bg-card">
      {/* Pair selector */}
      <button
        type="button"
        onClick={handleBackToHome}
        className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border cursor-pointer font-extrabold text-base"
      >
        <Star
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            isFavorite && "text-yellow-400 fill-yellow-400"
          )}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
        />
        {displaySymbol}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {/* Price stat */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Price</span>
        <span className={cn("text-[13px] font-semibold tabular-nums", isPositive ? "text-success" : "text-destructive")}>
          {price}
        </span>
      </div>

      {/* 24h Change stat */}
      <div className="hidden sm:flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">24h Change</span>
        <span className={cn("text-[13px] font-semibold tabular-nums", isPositive ? "text-success" : "text-destructive")}>
          {priceChange}
        </span>
      </div>

      {/* Volume stat */}
      <div className="hidden md:flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Volume</span>
        <span className="text-[13px] font-semibold tabular-nums">{volume}</span>
      </div>

      {/* Market type badge */}
      <div className="hidden sm:flex">
        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[hsl(var(--primary)/0.08)] text-primary">
          {marketType === "futures" ? "Futures" : "Spot"}
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hidden md:flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-transparent border border-border cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{currentPreset || "Default"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {presetKeys.map((preset) => (
              <DropdownMenuItem
                key={preset}
                onClick={() => handlePresetSelect(preset)}
                className={cn("text-xs cursor-pointer", currentPreset === preset && "bg-primary/10")}
              >
                {preset}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSaveDialogOpen(true)} className="text-xs cursor-pointer">
              <Save className="h-3.5 w-3.5 mr-1" />
              {t("save_current_layout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center bg-transparent border border-border cursor-pointer text-foreground hover:bg-foreground/5"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        <button
          type="button"
          className="w-8 h-8 hidden sm:flex items-center justify-center bg-transparent border border-border cursor-pointer text-foreground hover:bg-foreground/5"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Save Layout Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("save_layout_preset")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                {t("Name")}
              </label>
              <Input
                id="name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="col-span-3"
                placeholder="My Custom Layout"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveLayout}>
              {t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
