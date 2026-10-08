import React from "react";
import { StatusBadge } from "./StatusBadge";

export interface DagNodeProps {
  id: string;
  name: string;
  status:
    | "PENDING"
    | "RUNNING"
    | "SUCCEEDED"
    | "FAILED"
    | "COMPENSATING"
    | "COMPENSATED"
    | "SKIPPED"
    | "CANCELLED";
  targetSystem?: string;
  durationMs?: number;
  attempts?: number;
  isCompensation?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export const DagNode: React.FC<DagNodeProps> = ({
  id,
  name,
  status,
  targetSystem,
  durationMs,
  attempts,
  isCompensation,
  isSelected,
  onClick,
}) => {
  const isRunning = status === "RUNNING" || status === "COMPENSATING";

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border p-4 transition-all select-none cursor-pointer bg-white ${
        isSelected
          ? "border-[#0A1B2E] ring-2 ring-[#0A1B2E] shadow-md"
          : "border-[#557392]/30 hover:border-[#557392] hover:shadow-xs"
      }`}
    >
      {isRunning && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#557392] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#557392]"></span>
        </span>
      )}

      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-mono font-medium text-[#557392] truncate max-w-[140px]">
          {id}
        </span>
        <StatusBadge status={status} size="sm" pulse={isRunning} />
      </div>

      <div className="text-sm font-semibold text-black flex items-center gap-1.5 mb-1.5">
        {isCompensation && (
          <span className="material-symbols-outlined text-[#557392] text-sm" title="Compensation Task">
            undo
          </span>
        )}
        <span className="truncate">{name}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-[#557392] font-mono mt-3 pt-2.5 border-t border-[#557392]/20">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-[#557392]">lan</span>
          <span>{targetSystem || "Internal"}</span>
        </div>
        <div className="flex items-center gap-2">
          {attempts !== undefined && attempts > 1 && (
            <span className="text-black text-[10px] bg-[#eef3f9] border border-[#557392]/30 px-1 rounded font-semibold">
              retry #{attempts}
            </span>
          )}
          {durationMs !== undefined && (
            <span>{durationMs}ms</span>
          )}
        </div>
      </div>
    </div>
  );
};
