"use client";

import React, { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "lg",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        className={`relative z-10 w-full ${maxWidthMap[maxWidth]} rounded-xl border border-slate-800 bg-slate-900 shadow-2xl transition-all`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100">{title}</h3>
            {description && (
              <p className="mt-1 text-xs text-slate-400">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="px-6 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-3.5 bg-slate-950/40 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
