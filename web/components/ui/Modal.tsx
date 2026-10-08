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
        className="fixed inset-0 bg-[#0A1B2E]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        className={`relative z-10 w-full ${maxWidthMap[maxWidth]} rounded-xl border border-[#557392]/30 bg-white shadow-2xl transition-all`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-[#557392]/20 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-black">{title}</h3>
            {description && (
              <p className="mt-1 text-xs text-[#557392]">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#557392] hover:bg-[#eef3f9] hover:text-black transition-colors"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="px-6 py-4 text-black">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-[#557392]/20 px-6 py-3.5 bg-[#eef3f9]/50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
