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
  const isFailed = status === "FAILED";
  const isSuccess = status === "SUCCEEDED";

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border p-4 transition-all select-none cursor-pointer ${
        isSelected
          ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500"
          : "border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900"
      }`}
    >
      {isRunning && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
        </span>
      )}

      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-mono font-medium text-slate-400 truncate max-w-[140px]">
          {id}
        </span>
        <StatusBadge status={status} size="sm" pulse={isRunning} />
      </div>

      <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 mb-1.5">
        {isCompensation && (
          <span className="material-symbols-outlined text-amber-400 text-sm" title="Compensation Task">
            undo
          </span>
        )}
        <span className="truncate">{name}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 font-mono mt-3 pt-2.5 border-t border-slate-800/80">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-slate-500">lan</span>
          <span>{targetSystem || "Internal"}</span>
        </div>
        <div className="flex items-center gap-2">
          {attempts !== undefined && attempts > 1 && (
            <span className="text-amber-400 text-[10px] bg-amber-500/10 px-1 rounded">
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
