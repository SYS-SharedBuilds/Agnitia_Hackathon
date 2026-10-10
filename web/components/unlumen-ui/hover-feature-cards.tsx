"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export interface HoverFeatureCard {
  name: string;
  description: string;
  badge?: string;
  tag?: string;
  icon?: string;
  href?: string;
  img?: string;
  imgLight?: string;
  imgClassName?: string;
  imgWidth?: number;
  containerClassName?: string;
  fadeBottom?: boolean;
  soon?: boolean;
  actionLabel?: string;
}

export interface HoverFeatureCardsProps {
  items: HoverFeatureCard[];
  className?: string;
  renderLink?: (href: string, children: React.ReactNode) => React.ReactNode;
}

function HoverFeatureCardComponent({
  item,
  renderLink,
}: {
  item: HoverFeatureCard;
  renderLink?: HoverFeatureCardsProps["renderLink"];
}) {
  const inner = (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      whileTap={{ scale: item.href && !item.soon ? 0.98 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      variants={{ rest: { scale: 1, y: 0 } }}
      className={cn(
        "group flex flex-col w-full relative",
        item.soon
          ? "opacity-80 cursor-not-allowed"
          : item.href
          ? "cursor-pointer"
          : ""
      )}
    >
      <div
        className={cn(
          "flex flex-col rounded-3xl border min-h-[220px] sm:min-h-[240px] z-10 bg-white transition-all duration-200 w-full shadow-xs",
          !item.soon && item.href
            ? "group-hover:border-sky-400 group-hover:shadow-md group-hover:shadow-sky-500/10"
            : "",
          item.soon ? "border-dashed border-slate-300 bg-slate-50/50" : "border-slate-200/90"
        )}
      >
        {item.soon && (
          <span className="absolute top-3.5 right-3.5 z-20 text-[11px] font-semibold text-slate-500 border border-slate-200 rounded-full px-2.5 py-0.5 bg-white shadow-2xs">
            Coming soon
          </span>
        )}

        <div
          className={cn(
            "relative w-full overflow-hidden p-6 flex flex-col justify-between flex-1 gap-3",
            item.containerClassName
          )}
        >
          {/* Top Row: Icon + Badge */}
          <div className="flex items-center justify-between">
            {item.icon ? (
              <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shadow-2xs group-hover:scale-105 group-hover:bg-sky-100/70 transition-all">
                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              </div>
            ) : null}

            {item.badge && !item.soon && (
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {item.badge}
              </span>
            )}
          </div>

          {/* Title & Tag */}
          <div className="space-y-1 mt-2">
            <span
              className={cn(
                "font-bold text-lg text-slate-900 tracking-tight block group-hover:text-sky-700 transition-colors",
                item.soon ? "text-slate-400" : ""
              )}
            >
              {item.name}
            </span>
            {item.tag && (
              <span className="text-xs font-mono font-medium text-slate-500 block">
                {item.tag}
              </span>
            )}
          </div>

          {/* Action indicator on Card Face */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100/80 text-xs font-semibold text-slate-600 group-hover:text-sky-600">
            <span>{item.actionLabel || "View & Configure Plan"}</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>

          {item.fadeBottom && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>
      </div>

      {/* Slide-out Description Panel on Hover */}
      <motion.div
        variants={{
          rest: { opacity: 0.1, y: -24 },
          hover: { opacity: 1, y: 0 },
        }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="overflow-hidden z-0 w-[94%] self-center"
      >
        <div className="py-3 px-5 relative border-t-0 rounded-b-2xl border border-slate-200/90 bg-slate-50/95 shadow-xs">
          <div className="pointer-events-none w-[103%] bg-gradient-to-b from-white to-transparent h-8 absolute -top-1 -left-1" />
          <p className="text-xs leading-relaxed text-slate-600">
            {item.description}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );

  if (item.href && renderLink) {
    return renderLink(item.href, inner);
  }

  return inner;
}

function HoverFeatureCards({
  items,
  className,
  renderLink,
}: HoverFeatureCardsProps) {
  return (
    <div
      className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full", className)}
    >
      {items.map((item) => (
        <HoverFeatureCardComponent key={item.name} item={item} renderLink={renderLink} />
      ))}
    </div>
  );
}

export { HoverFeatureCards, HoverFeatureCardComponent as HoverFeatureCard };
