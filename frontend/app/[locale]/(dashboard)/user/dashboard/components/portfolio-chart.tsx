"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const TIME_RANGES = ["7D", "30D", "90D", "1Y"] as const;

// Mock portfolio data for each time range
const CHART_DATA: Record<string, { label: string; value: number }[]> = {
  "7D": [
    { label: "Mon", value: 9210 },
    { label: "Tue", value: 9380 },
    { label: "Wed", value: 9150 },
    { label: "Thu", value: 9520 },
    { label: "Fri", value: 9440 },
    { label: "Sat", value: 9680 },
    { label: "Sun", value: 9834 },
  ],
  "30D": [
    { label: "Aug 1", value: 8420 },
    { label: "Aug 5", value: 8710 },
    { label: "Aug 9", value: 8350 },
    { label: "Aug 13", value: 8900 },
    { label: "Aug 17", value: 9100 },
    { label: "Aug 21", value: 8980 },
    { label: "Aug 25", value: 9340 },
    { label: "Aug 31", value: 9834 },
  ],
  "90D": [
    { label: "Jun", value: 7200 },
    { label: "Jun+", value: 7650 },
    { label: "Jul", value: 7890 },
    { label: "Jul+", value: 8100 },
    { label: "Aug", value: 8420 },
    { label: "Aug+", value: 9100 },
    { label: "Now", value: 9834 },
  ],
  "1Y": [
    { label: "Sep '25", value: 4200 },
    { label: "Nov '25", value: 5100 },
    { label: "Jan '26", value: 4800 },
    { label: "Mar '26", value: 6300 },
    { label: "May '26", value: 7100 },
    { label: "Jul '26", value: 8400 },
    { label: "Aug '26", value: 9834 },
  ],
};

export function PortfolioChart() {
  const [activeRange, setActiveRange] = useState<string>("7D");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    label: string;
    value: number;
  } | null>(null);

  const data = CHART_DATA[activeRange];

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const w = rect.width;
    const h = rect.height;
    const padTop = 20;
    const padBottom = 30;
    const padLeft = 50;
    const padRight = 16;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    const values = data.map((d) => d.value);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.02;
    const range = maxVal - minVal || 1;

    // Compute dark mode
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const textColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";

    // Grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padTop + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      // Y-axis labels
      const val = maxVal - (range / gridLines) * i;
      ctx.fillStyle = textColor;
      ctx.font = "11px var(--font-archivo), system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(
        "$" + val.toLocaleString("en-US", { maximumFractionDigits: 0 }),
        padLeft - 8,
        y + 4
      );
    }

    // Data points
    const points = data.map((d, i) => ({
      x: padLeft + (chartW / (data.length - 1)) * i,
      y: padTop + chartH - ((d.value - minVal) / range) * chartH,
    }));

    // Area fill gradient
    const gradient = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
    gradient.addColorStop(0, "rgba(51,117,187,0.25)");
    gradient.addColorStop(1, "rgba(51,117,187,0.02)");

    ctx.beginPath();
    ctx.moveTo(points[0].x, h - padBottom);
    ctx.lineTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) * 0.4;
      const cp1y = points[i - 1].y;
      const cp2x = points[i].x - (points[i].x - points[i - 1].x) * 0.4;
      const cp2y = points[i].y;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, h - padBottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) * 0.4;
      const cp1y = points[i - 1].y;
      const cp2x = points[i].x - (points[i].x - points[i - 1].x) * 0.4;
      const cp2y = points[i].y;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
    }
    ctx.strokeStyle = "#3375BB";
    ctx.lineWidth = 2;
    ctx.stroke();

    // X-axis labels
    data.forEach((d, i) => {
      ctx.fillStyle = textColor;
      ctx.font = "10px var(--font-archivo), system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(d.label, points[i].x, h - 8);
    });

    // Data dots
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#3375BB";
      ctx.fill();
      ctx.strokeStyle = isDark ? "#161B22" : "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [data]);

  useEffect(() => {
    drawChart();
    const handleResize = () => drawChart();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawChart]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const w = rect.width;
    const padLeft = 50;
    const padRight = 16;
    const chartW = w - padLeft - padRight;

    const closestIdx = data.reduce((closest, _, i) => {
      const px = padLeft + (chartW / (data.length - 1)) * i;
      const dist = Math.abs(mouseX - px);
      const closestDist = Math.abs(
        mouseX - (padLeft + (chartW / (data.length - 1)) * closest)
      );
      return dist < closestDist ? i : closest;
    }, 0);

    const px = padLeft + (chartW / (data.length - 1)) * closestIdx;
    const padTop = 20;
    const padBottom = 30;
    const chartH = rect.height - padTop - padBottom;
    const values = data.map((d) => d.value);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.02;
    const range = maxVal - minVal || 1;
    const py =
      padTop +
      chartH -
      ((data[closestIdx].value - minVal) / range) * chartH;

    setHoverInfo({
      x: px,
      y: py,
      label: data[closestIdx].label,
      value: data[closestIdx].value,
    });

    // Redraw with hover line
    drawChart();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);

    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Vertical hover line
    ctx.strokeStyle = isDark
      ? "rgba(255,255,255,0.15)"
      : "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px, padTop);
    ctx.lineTo(px, rect.height - padBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Hover dot
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#3375BB";
    ctx.fill();
    ctx.strokeStyle = isDark ? "#161B22" : "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
    drawChart();
  };

  return (
    <div className="bg-card border border-border p-5">
      <div className="flex justify-between items-center mb-4">
        <span className="font-extrabold text-[15px] tracking-tight">
          Portfolio Value
        </span>
        <div className="flex gap-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`text-[11px] px-3 py-1.5 font-bold cursor-pointer border-none transition-colors ${
                activeRange === range
                  ? "bg-primary text-white"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="relative h-[240px]">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {hoverInfo && (
          <div
            className="absolute pointer-events-none bg-card border border-border px-3 py-2 shadow-lg z-10"
            style={{
              left: `${Math.min(hoverInfo.x, (containerRef.current?.getBoundingClientRect().width || 300) - 120)}px`,
              top: `${Math.max(hoverInfo.y - 50, 0)}px`,
            }}
          >
            <span className="text-[10px] text-muted-foreground block">
              {hoverInfo.label}
            </span>
            <span className="text-[14px] font-extrabold tabular-nums">
              $
              {hoverInfo.value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
