"use client";

import React, { useState, useMemo, useRef } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export interface TrendPoint {
  time: string;
  p50: number;
  p95: number;
  p99: number;
  orders: number;
  slo: number;
}

const RAW_TREND_DATA: TrendPoint[] = [
  { time: "-60m", p50: 2.35, p95: 5.02, p99: 7.65, orders: 42, slo: 6.0 },
  { time: "-55m", p50: 2.38, p95: 5.15, p99: 7.55, orders: 48, slo: 6.0 },
  { time: "-50m", p50: 2.42, p95: 5.30, p99: 7.90, orders: 53, slo: 6.0 },
  { time: "-45m", p50: 2.45, p95: 5.38, p99: 8.35, orders: 61, slo: 6.0 },
  { time: "-40m", p50: 2.50, p95: 5.42, p99: 8.65, orders: 67, slo: 6.0 },
  { time: "-35m", p50: 2.62, p95: 5.35, p99: 8.70, orders: 74, slo: 6.0 },
  { time: "-30m", p50: 2.85, p95: 5.50, p99: 8.40, orders: 85, slo: 6.0 },
  { time: "-25m", p50: 3.10, p95: 5.95, p99: 7.80, orders: 92, slo: 6.0 },
  { time: "-20m", p50: 3.18, p95: 6.15, p99: 7.50, orders: 88, slo: 6.0 },
  { time: "-15m", p50: 3.05, p95: 5.80, p99: 7.75, orders: 79, slo: 6.0 },
  { time: "-10m", p50: 2.82, p95: 5.25, p99: 8.30, orders: 71, slo: 6.0 },
  { time: "-5m", p50: 2.75, p95: 4.80, p99: 8.75, orders: 65, slo: 6.0 },
  { time: "Now", p50: 2.80, p95: 5.40, p99: 8.10, orders: 58, slo: 6.0 },
];

export function InteractiveActivationTrendChart() {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const totalPoints = RAW_TREND_DATA.length;
  const visibleCount = Math.max(4, Math.round(totalPoints / zoomLevel));
  const maxOffset = Math.max(0, totalPoints - visibleCount);
  const clampedOffset = Math.min(Math.max(0, panOffset), maxOffset);

  const visibleData = useMemo(
    () => RAW_TREND_DATA.slice(clampedOffset, clampedOffset + visibleCount),
    [clampedOffset, visibleCount]
  );

  const chartWidth = 740;
  const chartHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 100;
  const paddingTop = 20;
  const paddingBottom = 25;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const maxY = 10;

  const getX = (idx: number) => {
    if (visibleData.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (idx / (visibleData.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return paddingTop + innerHeight - (Math.max(0, Math.min(maxY, val)) / maxY) * innerHeight;
  };

  const createSmoothPath = (values: number[]) => {
    if (values.length === 0) return "";
    const points = values.map((val, idx) => ({ x: getX(idx), y: getY(val) }));
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const pathP50 = useMemo(() => createSmoothPath(visibleData.map((d) => d.p50)), [visibleData]);
  const pathP95 = useMemo(() => createSmoothPath(visibleData.map((d) => d.p95)), [visibleData]);
  const pathP99 = useMemo(() => createSmoothPath(visibleData.map((d) => d.p99)), [visibleData]);

  const activePoint = hoverIndex !== null && visibleData[hoverIndex] ? visibleData[hoverIndex] : null;
  const activeX = hoverIndex !== null ? getX(hoverIndex) : 0;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging && dragStartX.current !== null) {
      const deltaX = e.clientX - dragStartX.current;
      if (Math.abs(deltaX) > 25) {
        const step = deltaX > 0 ? -1 : 1;
        setPanOffset((prev) => Math.min(Math.max(0, prev + step), maxOffset));
        dragStartX.current = e.clientX;
      }
      return;
    }

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relativeX = (mouseX / rect.width) * chartWidth;

    if (relativeX < paddingLeft || relativeX > paddingLeft + innerWidth) {
      setHoverIndex(null);
      return;
    }

    let closestIdx = 0;
    let minDistance = Infinity;
    for (let i = 0; i < visibleData.length; i++) {
      const dist = Math.abs(getX(i) - relativeX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = i;
      }
    }
    setHoverIndex(closestIdx);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) > 5) {
      if (e.deltaY < 0) {
        setZoomLevel((prev) => Math.min(3, +(prev * 1.35).toFixed(2)));
      } else {
        setZoomLevel((prev) => {
          const next = Math.max(1, +(prev / 1.35).toFixed(2));
          if (next === 1) setPanOffset(0);
          return next;
        });
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartX.current = null;
  };

  return (
    <div className="flex flex-col w-full h-full justify-between select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F1F5F9]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight">Activation time trend</h3>
            {zoomLevel > 1 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold border border-blue-200">
                {zoomLevel}x Zoomed {panOffset > 0 ? "• Panned" : ""}
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#64748B]">p50, p95, p99 over the last 60 min • Hover or scroll to inspect</p>
        </div>

        {/* Zoom controls & Legends */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
            <button
              onClick={() => setZoomLevel((prev) => Math.min(3, +(prev * 1.35).toFixed(2)))}
              title="Zoom In"
              className="p-1 rounded text-[#000000] hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                setZoomLevel((prev) => {
                  const next = Math.max(1, +(prev / 1.35).toFixed(2));
                  if (next === 1) setPanOffset(0);
                  return next;
                })
              }
              title="Zoom Out"
              className="p-1 rounded text-[#000000] hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            {zoomLevel > 1 && (
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset(0);
                }}
                title="Reset Zoom"
                className="p-1 rounded text-[#000000] hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                aria-label="Reset zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3.5 flex-wrap text-[11.5px] font-medium font-mono">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]"></span>
              <span className="text-[#0F172A]">p50 ({visibleData[visibleData.length - 1]?.p50.toFixed(1)}s)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#475569]"></span>
              <span className="text-[#0F172A]">p95 ({visibleData[visibleData.length - 1]?.p95.toFixed(1)}s)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#EEB930]"></span>
              <span className="text-[#0F172A]">p99 Spikes ({visibleData[visibleData.length - 1]?.p99.toFixed(1)}s)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 border-b-2 border-dashed border-[#ED2C2C]"></span>
              <span className="text-[#0F172A]">SLO 6.0s Target</span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className={`relative w-full h-[225px] mt-3 ${
          zoomLevel > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-crosshair"
        }`}
      >
        <svg
          ref={svgRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setHoverIndex(null);
            setIsDragging(false);
          }}
          className="w-full h-full overflow-visible"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[10, 8, 6, 4, 2, 0].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line stroke="#E8ECF3" strokeWidth="1" x1={paddingLeft} x2={paddingLeft + innerWidth} y1={y} y2={y} />
                <text className="text-[10px] fill-[#94A3B8] font-mono" textAnchor="end" x={paddingLeft - 10} y={y + 4}>
                  {val}s
                </text>
              </g>
            );
          })}

          {/* SLO Reference Line */}
          <line
            stroke="#ED2C2C"
            strokeDasharray="5 4"
            strokeWidth="1.6"
            x1={paddingLeft}
            x2={paddingLeft + innerWidth}
            y1={getY(6.0)}
            y2={getY(6.0)}
          />
          <rect fill="#FEF2F2" height="18" rx="3" stroke="#ED2C2C" width="95" x={paddingLeft + innerWidth + 5} y={getY(6.0) - 9} />
          <text className="text-[9.5px] fill-[#ED2C2C] font-mono font-bold" textAnchor="middle" x={paddingLeft + innerWidth + 52} y={getY(6.0) + 3}>
            SLO 6.0s Target
          </text>

          {/* Curves */}
          <path d={pathP99} fill="none" stroke="#EEB930" strokeLinecap="round" strokeWidth="2.4" />
          <path d={pathP95} fill="none" stroke="#475569" strokeLinecap="round" strokeWidth="2.2" />
          <path d={pathP50} fill="none" stroke="#2563EB" strokeLinecap="round" strokeWidth="2.6" />

          {/* Dots on points */}
          {visibleData.map((d, i) => (
            <g key={i}>
              <circle cx={getX(i)} cy={getY(d.p99)} fill="#EEB930" r="3.5" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx={getX(i)} cy={getY(d.p95)} fill="#475569" r="3" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx={getX(i)} cy={getY(d.p50)} fill="#2563EB" r="4" stroke="#FFFFFF" strokeWidth="1.5" />
            </g>
          ))}

          {/* Active Hover Cursor & Tooltip Indicator */}
          {activePoint && (
            <g>
              <line
                stroke="#64748B"
                strokeDasharray="3 3"
                strokeWidth="1.2"
                x1={activeX}
                x2={activeX}
                y1={paddingTop}
                y2={paddingTop + innerHeight}
              />
              <circle cx={activeX} cy={getY(activePoint.p99)} fill="#94A3B8" r="5.5" stroke="#0F172A" strokeWidth="2" />
              <circle cx={activeX} cy={getY(activePoint.p95)} fill="#475569" r="5.5" stroke="#0F172A" strokeWidth="2" />
              <circle cx={activeX} cy={getY(activePoint.p50)} fill="#0A1B2E" r="6" stroke="#2563EB" strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* Floating Custom Tooltip */}
        {activePoint && (
          <div
            className="absolute z-20 pointer-events-none rounded-xl bg-[#0F172A] text-white p-3 shadow-2xl border border-slate-700/80 w-64 backdrop-blur-sm transition-all"
            style={{
              left: `${Math.min(Math.max(10, (activeX / chartWidth) * 100), 72)}%`,
              top: "10px",
            }}
          >
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-700/80">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="font-mono text-[12px] font-semibold text-slate-200">
                  {activePoint.time === "Now" ? "Now (Live)" : `${activePoint.time} window`}
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">{activePoint.orders} orders</span>
            </div>

            <div className="space-y-1.5 font-mono text-[12px]">
              <div className="flex justify-between items-center text-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#0A1B2E] border border-slate-400" />
                  <span>p50 (Median):</span>
                </span>
                <span className="font-bold text-white">{activePoint.p50.toFixed(2)}s</span>
              </div>

              <div className="flex justify-between items-center text-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#475569]" />
                  <span>p95 (Tail):</span>
                </span>
                <span className="font-bold text-slate-200">{activePoint.p95.toFixed(2)}s</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#94A3B8]" />
                  <span>p99 (Outlier):</span>
                </span>
                <span className="font-bold text-slate-300">{activePoint.p99.toFixed(2)}s</span>
              </div>

              <div className="pt-2 mt-1 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">SLO Status (6.0s):</span>
                <span
                  className={`font-semibold ${
                    activePoint.p95 <= 6.0 ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {activePoint.p95 <= 6.0
                    ? `✓ Compliant (+${(6.0 - activePoint.p95).toFixed(2)}s)`
                    : `⚠ Breached (${Math.abs(+(6.0 - activePoint.p95).toFixed(2))}s)`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* X-Axis Labels */}
      <div className="flex justify-between items-center text-[10.5px] font-mono text-[#94A3B8] pt-2 pl-9 pr-2 border-t border-[#F8FAFC]">
        {visibleData.map((d, i) => (
          <span key={i} className={d.time === "Now" ? "font-semibold text-[#0A1B2E]" : ""}>
            {d.time}
          </span>
        ))}
      </div>
    </div>
  );
}
