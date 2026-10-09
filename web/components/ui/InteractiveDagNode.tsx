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

  return (
    <div className="relative group">
      {/* Target handle on Left */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-[#0A1B2E] !border-2 !border-white transition-transform hover:!scale-125"
      />
      {/* Top handle for branch convergence / re-routing */}
      <Handle
        type="target"
        id="top"
        position={Position.Top}
        className="!w-2 !h-2 !bg-[#0A1B2E] !border-2 !border-white opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Main card box */}
      <div
        className={`w-[175px] min-h-[74px] p-2.5 rounded-lg flex flex-col justify-between transition-all select-none shadow-xs border ${
          data.isStalled
            ? "bg-[#F8FAFC] opacity-80"
            : data.isBestEffort
            ? "bg-white opacity-85 border-dashed border-2"
            : "bg-white hover:shadow-md"
        } ${
          isSelected
            ? "border-[#0A1B2E] ring-2 ring-[#0A1B2E] shadow-md !opacity-100"
            : "border-[#CBD5E1] hover:border-[#0A1B2E]"
        }`}
        style={{
          borderLeft: data.isBestEffort
            ? undefined
            : data.isStalled
            ? "4px solid #CBD5E1"
            : "4px solid #0A1B2E",
        }}
      >
        {/* Header row: system tag & status */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <span
            className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold uppercase truncate max-w-[85px] ${
              data.badgeStyle === "noc"
                ? "bg-[#0A1B2E] text-white"
                : "bg-[#F1F5F9] text-[#0A1B2E]"
            }`}
          >
            {data.system}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {data.badgeText && (
              <span
                className={`font-mono text-[9px] px-1 py-0.2 rounded border font-bold ${
                  data.badgeStyle === "failed" || data.status === "FAILED"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-white text-[#0A1B2E] border-[#CBD5E1]"
                }`}
              >
                {data.badgeText}
              </span>
            )}

            {data.status === "SUCCEEDED" && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#0A1B2E] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A1B2E]"></span>
                SUCCEEDED
              </span>
            )}

            {data.status === "FAILED" && (
              <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-red-600 font-bold">
                <span className="material-symbols-outlined text-[13px]">warning</span>
                FAILED
              </span>
            )}

            {data.status === "RESOLVED" && (
              <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-[#0A1B2E] font-bold">
                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                RESOLVED
              </span>
            )}

            {data.status === "STALLED" && (
              <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-[#64748B] font-semibold">
                <span className="material-symbols-outlined text-[12px]">pause_circle</span>
                STALLED
              </span>
            )}

            {data.isBestEffort && (
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-[#000000] font-medium">
                best-effort
              </span>
            )}
          </div>
        </div>

        {/* Task Name */}
        <div className="text-[12px] font-semibold text-[#0A1B2E] truncate mb-1">
          {data.name}
        </div>

        {/* Footer row: Meta Left & Meta Right */}
        <div className="flex items-center justify-between font-mono text-[10px] text-[#64748B] pt-0.5 border-t border-slate-100/60">
          <span className="truncate max-w-[95px]">{data.metaLeft}</span>
          <span className="shrink-0">{data.metaRight}</span>
        </div>
      </div>

      {/* Tooltip for special alerts (e.g. NOC resolution / stall info) */}
      {data.tooltipText && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[280px] bg-white rounded-lg shadow-xl border border-[#CBD5E1] p-2.5 z-40 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0A1B2E] mb-0.5">
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
        className="!w-2 !h-2 !bg-[#0A1B2E] !border-2 !border-white opacity-0 group-hover:opacity-100 transition-opacity"
      />
      {/* Source handle on Right */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-[#0A1B2E] !border-2 !border-white transition-transform hover:!scale-125"
      />
    </div>
  );
};
