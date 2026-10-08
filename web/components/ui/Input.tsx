import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: string;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, rightElement, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-black">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="material-symbols-outlined absolute left-3 text-[#557392] text-lg pointer-events-none select-none">
              {icon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-black placeholder:text-[#557392]/60 transition-colors focus:outline-none focus:ring-1 ${
              icon ? "pl-9" : ""
            } ${rightElement ? "pr-10" : ""} ${
              error
                ? "border-[#0A1B2E] focus:border-[#0A1B2E] focus:ring-[#0A1B2E]/20"
                : "border-[#557392] focus:border-[#0A1B2E] focus:ring-[#0A1B2E]/20"
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-black font-semibold">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#557392]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
