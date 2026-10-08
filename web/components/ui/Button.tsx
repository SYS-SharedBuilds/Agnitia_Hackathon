import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: string;
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  let variantCls = "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-xs";

  switch (variant) {
    case "primary":
      variantCls = "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-xs active:bg-[#1E40AF]";
      break;
    case "secondary":
      variantCls =
        "bg-white text-[#0A1B2E] hover:bg-[#F1F5F9] border border-[#CBD5E1] active:bg-[#E2E8F0]";
      break;
    case "outline":
      variantCls =
        "bg-white text-[#2563EB] hover:bg-[#EFF6FF] border border-[#2563EB] shadow-2xs";
      break;
    case "destructive":
      variantCls = "bg-[#DC2626] text-white hover:bg-[#B91C1C] border border-[#DC2626] shadow-xs";
      break;
    case "ghost":
      variantCls = "text-[#0A1B2E] hover:bg-[#F1F5F9] hover:text-[#2563EB]";
      break;
  }

  let sizeCls = "h-9 px-4 text-body-md";
  if (size === "sm") sizeCls = "h-7 px-2.5 text-label-sm";
  if (size === "lg") sizeCls = "h-11 px-5 text-headline-sm";

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantCls} ${sizeCls} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            d="M4 12a8 8 0 018-8v8H4z"
            fill="currentColor"
          />
        </svg>
      ) : icon ? (
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
