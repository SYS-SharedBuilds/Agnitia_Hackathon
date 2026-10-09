import React from "react";
import { Handle, Position } from "@xyflow/react";

export interface DagNodeData extends Record<string, unknown> {
  taskId: string;
  system: string;
  name: string;
  metaLeft: string;
  metaRight: string;
  status: "SUCCEEDED" | "FAILED" | "STALLED" | "RESOLVED" | "PAUSED / WAITING";
  badgeText?: string;
  badgeStyle?: "default" | "noc" | "failed" | "attempt";
  isResolved?: boolean;
  isStalled?: boolean;
  isBestEffort?: boolean;
  tooltipText?: string;
  tooltipTitle?: string;
  isSelected?: boolean;
}

export const InteractiveDagNode = ({
  data,
  selected,
}: {
  data: DagNodeData;
  selected?: boolean;
}) => {
  const isSelected = selected || data.isSelected;

  const isFailed = data.status === "FAILED" || data.badgeStyle === "failed";
  const isSucceeded = data.status === "SUCCEEDED" || data.status === "RESOLVED";
  const isRunning = data.status === "RUNNING";
  const isRetrying = data.status === "RETRYING";
  const isCompensated = data.status === "COMPENSATED" || data.status === "STALLED";

  // Derive card background, border color, and accent
  let cardBg = "bg-white";
  let cardBorder = "border-[#E2E8F0]";
  let accentBarColor = "#2563EB";
  let haloShadow = "";

  if (isSucceeded) {
    cardBg = "bg-[#F0FDF4]";
    cardBorder = "border-[#22C55E]";
    accentBarColor = "#22C55E";
  } else if (isFailed) {
    cardBg = "bg-[#FEF2F2]";
    cardBorder = "border-[#ED2C2C]";
    accentBarColor = "#ED2C2C";
    haloShadow = "shadow-[0_0_14px_#ed2c2cb3]";
  } else if (isRunning) {
    cardBg = "bg-[#EFF6FF]";
    cardBorder = "border-[#2563EB]";
    accentBarColor = "#2563EB";
  } else if (isRetrying) {
    cardBg = "bg-[#FEFCE8]";
    cardBorder = "border-[#EEB930]";
    accentBarColor = "#EEB930";
  } else if (isCompensated) {
    cardBg = "bg-[#F5F5F4]";
    cardBorder = "border-[#8B7B65]";
    accentBarColor = "#8B7B65";
  }

  return (
    <div className="relative group">
      {/* Target handle on Left */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-[#0F172A] !border-2 !border-white transition-transform hover:!scale-125"
      />
      {/* Top handle for branch convergence / re-routing */}
      <Handle
        type="target"
        id="top"
        position={Position.Top}
        className="!w-2 !h-2 !bg-[#0F172A] !border-2 !border-white opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Main card box */}
      <div
        className={`w-[175px] min-h-[74px] p-2.5 rounded-lg flex flex-col justify-between transition-all select-none border ${cardBg} ${cardBorder} ${haloShadow} ${
          data.isStalled
            ? "opacity-85"
            : data.isBestEffort
            ? "border-dashed border-2"
            : "hover:shadow-md"
        } ${
          isSelected
            ? "!border-[#0F172A] ring-2 ring-[#0F172A] shadow-md !opacity-100"
            : ""
        }`}
        style={{
          borderLeft: data.isBestEffort
            ? undefined
            : `4px solid ${accentBarColor}`,
        }}
      >
        {/* Header row: system tag & status */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <span
            className="font-mono text-[10px] px-1.5 py-0.5 rounded font-bold uppercase truncate max-w-[85px] bg-[#0F172A] text-white"
          >
            {data.system}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {data.badgeText && (
              <span
                className={`font-mono text-[9px] px-1 py-0.2 rounded border font-bold ${
                  isFailed
                    ? "bg-[#FEF2F2] text-[#ED2C2C] border-[#ED2C2C]"
                    : "bg-white text-[#0F172A] border-[#E2E8F0]"
                }`}
              >
                {data.badgeText}
              </span>
            )}

            {isSucceeded && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#22C55E] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                {data.status === "RESOLVED" ? "RESOLVED" : "ACTIVE"}
              </span>
            )}

            {isFailed && (
              <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-[#ED2C2C] font-bold">
                <span className="material-symbols-outlined text-[13px]">warning</span>
                FAILED
              </span>
            )}

            {isRunning && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#2563EB] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-ping"></span>
                RUNNING
              </span>
            )}

            {isRetrying && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#EEB930] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EEB930] animate-pulse"></span>
                RETRY
              </span>
            )}

            {isCompensated && !isFailed && !isSucceeded && (
              <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-[#8B7B65] font-semibold">
                <span className="material-symbols-outlined text-[12px]">undo</span>
                UNDONE
              </span>
            )}

            {data.isBestEffort && (
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#F8FAFC] text-[#475569] font-medium border border-[#E2E8F0]">
                best-effort
              </span>
            )}
          </div>
        </div>

        {/* Task Name */}
        <div className="text-[12px] font-semibold text-[#0F172A] truncate mb-1">
          {data.name}
        </div>

        {/* Footer row: Meta Left & Meta Right */}
        <div className="flex items-center justify-between font-mono text-[10px] text-[#475569] pt-0.5 border-t border-[#E2E8F0]/70">
          <span className="truncate max-w-[95px]">{data.metaLeft}</span>
          <span className="shrink-0">{data.metaRight}</span>
        </div>
      </div>

      {/* Tooltip for special alerts */}
      {data.tooltipText && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[280px] bg-white rounded-lg shadow-xl border border-[#E2E8F0] p-2.5 z-40 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0F172A] mb-0.5">
            <span className="material-symbols-outlined text-[14px]">
              {data.isResolved ? "task_alt" : "error"}
            </span>
            <span>{data.tooltipTitle || "Status Detail"}</span>
          </div>
          <p className="text-[10px] text-[#475569] leading-snug">
            {data.tooltipText}
          </p>
        </div>
      )}

      {/* Bottom handle for compensation flow */}
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-[#0F172A] !border-2 !border-white opacity-0 group-hover:opacity-100 transition-opacity"
      />
      {/* Source handle on Right */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-[#0F172A] !border-2 !border-white transition-transform hover:!scale-125"
      />
    </div>
  );
};
