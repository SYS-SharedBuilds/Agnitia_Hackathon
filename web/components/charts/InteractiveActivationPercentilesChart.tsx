"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export interface PercentileDataPoint {
  time: string;
  p50: number;
  p95: number;
  p99: number;
  tx: number;
}

const RAW_PERCENTILE_DATA: PercentileDataPoint[] = [
  { time: "00:00", p50: 1.48, p95: 4.10, p99: 5.60, tx: 310 },
  { time: "02:00", p50: 1.50, p95: 4.15, p99: 5.68, tx: 285 },
  { time: "04:00", p50: 1.52, p95: 4.18, p99: 5.72, tx: 260 },
  { time: "06:00", p50: 1.54, p95: 4.12, p99: 5.58, tx: 340 },
  { time: "08:00", p50: 1.55, p95: 4.10, p99: 5.48, tx: 490 },
  { time: "10:00", p50: 1.58, p95: 4.16, p99: 5.55, tx: 560 },
  { time: "12:00", p50: 1.62, p95: 4.22, p99: 5.70, tx: 610 },
  { time: "14:00", p50: 1.68, p95: 4.30, p99: 5.82, tx: 482 },
  { time: "16:00", p50: 1.60, p95: 4.35, p99: 5.85, tx: 730 },
  { time: "18:00", p50: 1.58, p95: 4.38, p99: 5.88, tx: 690 },
  { time: "20:00", p50: 1.55, p95: 4.35, p99: 5.82, tx: 580 },
  { time: "22:00", p50: 1.58, p95: 4.36, p99: 5.85, tx: 420 },
  { time: "24:00", p50: 1.60, p95: 4.35, p99: 5.88, tx: 350 },
];

const SLO = 6.0;

export function InteractiveActivationPercentilesChart() {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const totalPoints = RAW_PERCENTILE_DATA.length;
  const visibleCount = Math.max(4, Math.round(totalPoints / zoomLevel));
  const maxOffset = Math.max(0, totalPoints - visibleCount);
  const clampedOffset = Math.min(Math.max(0, panOffset), maxOffset);

  const visibleData = useMemo(
    () => RAW_PERCENTILE_DATA.slice(clampedOffset, clampedOffset + visibleCount),
    [clampedOffset, visibleCount]
  );

  const W = 800;
  const H = 270;
  const PL = 45;
  const PR = 75;
  const PT = 20;
  const PB = 30;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const maxY = 6.5;

  const getX = (idx: number) => {
    if (visibleData.length <= 1) return PL + innerW / 2;
    return PL + (idx / (visibleData.length - 1)) * innerW;
  };

  const getY = (val: number) =>
    PT + innerH - (Math.max(0, Math.min(maxY, val)) / maxY) * innerH;

  const smoothPath = (values: number[]) => {
    if (values.length === 0) return "";
    const pts = values.map((v, i) => ({ x: getX(i), y: getY(v) }));
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const areaPath = useCallback(
    (values: number[]) => {
      const linePath = smoothPath(values);
      if (!linePath) return "";
      const startX = getX(0);
      const endX = getX(values.length - 1);
      const baseY = PT + innerH;
      return `${linePath} L ${endX.toFixed(1)} ${baseY} L ${startX.toFixed(1)} ${baseY} Z`;
    },
    [visibleData]
  );

  const pathP99 = useMemo(() => smoothPath(visibleData.map((d) => d.p99)), [visibleData]);
  const pathP95 = useMemo(() => smoothPath(visibleData.map((d) => d.p95)), [visibleData]);
  const pathP50 = useMemo(() => smoothPath(visibleData.map((d) => d.p50)), [visibleData]);
  const areaP50 = useMemo(() => areaPath(visibleData.map((d) => d.p50)), [visibleData, areaPath]);

  const activePoint = hoverIndex !== null && visibleData[hoverIndex] ? visibleData[hoverIndex] : null;
  const activeX = hoverIndex !== null ? getX(hoverIndex) : 0;

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
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
    const relX = ((e.clientX - rect.left) / rect.width) * W;

    if (relX < PL || relX > PL + innerW) {
      setHoverIndex(null);
      return;
    }

    let closestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < visibleData.length; i++) {
      const dist = Math.abs(getX(i) - relX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    setHoverIndex(closestIdx);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel((prev) => Math.min(3, +(prev * 1.35).toFixed(2)));
    } else {
      setZoomLevel((prev) => {
        const next = Math.max(1, +(prev / 1.35).toFixed(2));
        if (next === 1) setPanOffset(0);
        return next;
      });
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

  const yTicks = [0, 1.5, 3.0, 4.5, 6.0];

  return (
    <div className="flex flex-col w-full select-none">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 pb-2">
        {zoomLevel > 1 && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold border border-blue-200">
            {zoomLevel}x Zoomed {panOffset > 0 ? "• Panned" : ""}
          </span>
        )}
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
          <button
            onClick={() => setZoomLevel((prev) => Math.min(3, +(prev * 1.35).toFixed(2)))}
            title="Zoom In"
            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
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
            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
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
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className={`relative w-full h-[280px] ${
          zoomLevel > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-crosshair"
        }`}
      >
        <svg
          ref={svgRef}
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={() => {
            setHoverIndex(null);
            handleMouseUp();
          }}
          className="w-full h-full overflow-visible"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="percGradP50" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0051d5" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#0051d5" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Y Grid + Labels */}
          {yTicks.map((val) => {
            const y = getY(val);
            const isSlo = val === SLO;
            return (
              <g key={val}>
                <line
                  stroke={isSlo ? "#ba1a1a" : "#eaedff"}
                  strokeDasharray={isSlo ? "4 4" : undefined}
                  strokeWidth={isSlo ? 1.5 : 1}
                  x1={PL} x2={PL + innerW} y1={y} y2={y}
                />
                <text
                  fill={isSlo ? "#ba1a1a" : "#777587"}
                  fontWeight={isSlo ? "600" : undefined}
                  textAnchor="end"
                  x={PL - 6}
                  y={y + 4}
                  style={{ fontSize: 10, fontFamily: "monospace" }}
                >
                  {val.toFixed(1)}s{isSlo ? " (SLO)" : ""}
                </text>
              </g>
            );
          })}

          {/* SLO label on right */}
          <text
            fill="#ba1a1a"
            fontWeight="600"
            textAnchor="start"
            x={PL + innerW + 6}
            y={getY(SLO) + 4}
            style={{ fontSize: 10, fontFamily: "monospace" }}
          >
            6.0s (SLO)
          </text>

          {/* Vertical time guides */}
          {visibleData.map((_, i) => (
            <line
              key={i}
              stroke="#f2f3ff"
              strokeWidth="1"
              x1={getX(i)} x2={getX(i)}
              y1={PT} y2={PT + innerH}
            />
          ))}

          {/* Area fill under p50 */}
          <path d={areaP50} fill="url(#percGradP50)" />

          {/* Curves */}
          <path d={pathP99} fill="none" stroke="#316bf3" strokeLinecap="round" strokeWidth="2.2" />
          <path d={pathP95} fill="none" stroke="#3525cd" strokeLinecap="round" strokeWidth="2.5" />
          <path d={pathP50} fill="none" stroke="#0051d5" strokeLinecap="round" strokeWidth="2.2" />

          {/* Dots on every point */}
          {visibleData.map((d, i) => (
            <g key={i}>
              <circle cx={getX(i)} cy={getY(d.p99)} fill="#316bf3" r="3" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx={getX(i)} cy={getY(d.p95)} fill="#3525cd" r="3" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx={getX(i)} cy={getY(d.p50)} fill="#0051d5" r="3" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          ))}

          {/* X-Axis Labels */}
          {visibleData.map((d, i) => (
            <text
              key={i}
              fill="#777587"
              textAnchor="middle"
              x={getX(i)}
              y={H - 4}
              style={{ fontSize: 10, fontFamily: "monospace" }}
            >
              {d.time}
            </text>
          ))}

          {/* Hover vertical crosshair + dots */}
          {activePoint && (
            <g>
              <line
                stroke="#3525cd"
                strokeDasharray="2 2"
                strokeWidth="1.2"
                x1={activeX} x2={activeX}
                y1={PT} y2={PT + innerH}
              />
              <circle cx={activeX} cy={getY(activePoint.p99)} fill="#316bf3" r="5.5" stroke="#ffffff" strokeWidth="2" />
              <circle cx={activeX} cy={getY(activePoint.p95)} fill="#3525cd" r="5.5" stroke="#ffffff" strokeWidth="2" />
              <circle cx={activeX} cy={getY(activePoint.p50)} fill="#0051d5" r="5.5" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* Floating Tooltip */}
        {activePoint && (
          <div
            className="absolute z-20 pointer-events-none rounded-xl bg-[#0F172A] text-white p-3 shadow-2xl border border-slate-700/80 w-64 transition-all"
            style={{
              left: `${Math.min(Math.max(5, (activeX / W) * 100), 68)}%`,
              top: "8px",
            }}
          >
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-700/80">
              <span className="font-mono text-[12px] font-semibold text-sky-400">
                {activePoint.time} UTC Sampling
              </span>
              <span className="font-mono text-[11px] text-slate-400">{activePoint.tx} tx</span>
            </div>

            <div className="space-y-1.5 font-mono text-[12px]">
              <div className="flex justify-between items-center text-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#0051d5]" />
                  <span>p50 (Median):</span>
                </span>
                <span className="font-bold text-white">{activePoint.p50.toFixed(2)}s</span>
              </div>

              <div className="flex justify-between items-center text-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#3525cd]" />
                  <span>p95 (Tail):</span>
                </span>
                <span className="font-bold text-slate-200">{activePoint.p95.toFixed(2)}s</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#316bf3]" />
                  <span>p99 (Outlier):</span>
                </span>
                <span className="font-bold text-slate-300">{activePoint.p99.toFixed(2)}s</span>
              </div>

              <div className="pt-2 mt-1 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">SLO Status:</span>
                <span
                  className={`font-semibold ${
                    activePoint.p99 <= SLO ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {activePoint.p99 <= SLO
                    ? `Compliant (-${(SLO - activePoint.p99).toFixed(2)}s)`
                    : `Breached (+${(activePoint.p99 - SLO).toFixed(2)}s)`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-[10.5px] font-mono text-[#777587] pt-2 border-t border-outline-variant/20">
        <span>Scroll to zoom • Drag to pan • Hover for exact values</span>
        <span className="font-semibold text-primary">100% Trace Sampling</span>
      </div>
    </div>
  );
}
