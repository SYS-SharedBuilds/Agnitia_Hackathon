import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

export function Card({ children, className = "", elevated = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-surface-container-lowest rounded-xl border border-[#E3E8F0] ${
        elevated ? "shadow-md" : "shadow-xs"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-4 border-b border-[#EDF0F5] flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-3.5 bg-surface-container-low/60 border-t border-[#EDF0F5] rounded-b-xl flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
