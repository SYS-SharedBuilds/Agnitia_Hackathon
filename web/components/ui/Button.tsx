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
  let variantCls = "bg-[#0A1B2E] text-white hover:bg-[#14263b] shadow-xs";

  switch (variant) {
    case "primary":
      variantCls = "bg-[#0A1B2E] text-white hover:bg-[#14263b] shadow-xs";
      break;
    case "secondary":
      variantCls =
        "bg-[#eef3f9] text-[#0A1B2E] hover:bg-[#e4ecf5] border border-[#557392]/30";
      break;
    case "outline":
      variantCls =
        "bg-white text-[#0A1B2E] hover:bg-[#eef3f9] border border-[#557392]/40 shadow-2xs";
      break;
    case "destructive":
      variantCls = "bg-[#0A1B2E] text-white hover:bg-[#14263b] border border-[#0A1B2E] shadow-xs";
      break;
    case "ghost":
      variantCls = "text-[#557392] hover:bg-[#eef3f9] hover:text-[#0A1B2E]";
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
