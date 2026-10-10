"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from "motion/react";

import { cn } from "@/lib/utils";

export interface DockItem {
  icon: React.ReactNode;
  label: string;
  /** if provided, item renders as an `<a>` */
  href?: string;
  onClick?: () => void;
  /** renders a visual separator after this item */
  separator?: boolean;
  isActive?: boolean;
}

export interface DockProps {
  items: DockItem[];
  /** @default 1.5 */
  magnification?: number;
  /** cursor radius (px) within which neighbors are magnified — @default 120 */
  distance?: number;
  /** @default 44 */
  iconSize?: number;
  /** @default 6 */
  gap?: number;
  /** @default 20 */
  borderRadius?: number;
  /** show labels permanently instead of on hover — @default false */
  alwaysShowLabels?: boolean;
  springOptions?: SpringOptions;
  className?: string;
}

const DEFAULT_SPRING: SpringOptions = {
  stiffness: 400,
  damping: 25,
  mass: 0.4,
};

function DockSeparator() {
  return (
    <div className="mx-1.5 flex items-center self-stretch">
      <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
    </div>
  );
}

function DockIcon({
  item,
  mouseX,
  magnification,
  distance,
  iconSize,
  borderRadius,
  alwaysShowLabels,
  springOptions,
  onHover,
  iconRef: externalIconRef,
}: {
  item: DockItem;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  magnification: number;
  distance: number;
  iconSize: number;
  borderRadius: number;
  alwaysShowLabels: boolean;
  springOptions: SpringOptions;
  onHover: (ref: React.RefObject<HTMLDivElement> | null) => void;
  iconRef: React.RefObject<HTMLDivElement>;
}) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const distanceFromMouse = useTransform(mouseX, (val) => {
    const el = wrapperRef.current;
    if (!el) return distance * 100;
    const rect = el.getBoundingClientRect();
    return Math.abs(val - (rect.left + rect.width / 2));
  });

  const gaussian = (d: number) =>
    (magnification - 1) * Math.exp(-(d * d) / (2 * distance * distance)) + 1;

  const widthRaw = useTransform(
    distanceFromMouse,
    (d) => iconSize * gaussian(d)
  );
  const heightRaw = useTransform(
    distanceFromMouse,
    (d) => iconSize * gaussian(d)
  );

  const width = useSpring(widthRaw, springOptions);
  const height = useSpring(heightRaw, springOptions);

  const Tag = item.href ? "a" : "button";

  return (
    <motion.div
      ref={wrapperRef}
      className="relative flex items-end justify-center select-none"
      style={{ width, height: iconSize }}
    >
      <motion.div
        ref={externalIconRef}
        style={{ width, height, bottom: 0 }}
        className="absolute"
      >
        <Tag
          href={item.href}
          onClick={item.onClick}
          onMouseEnter={() => onHover(externalIconRef)}
          onMouseLeave={() => onHover(null)}
          aria-label={item.label}
          style={{ borderRadius }}
          className={cn(
            "flex h-full w-full items-center justify-center relative",
            "transition-all duration-150 cursor-pointer",
            item.isActive
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-400/50"
              : "text-slate-700 bg-white/90 hover:bg-sky-50 hover:text-sky-700 border border-slate-200/90 shadow-xs",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
            "[&_svg]:size-[50%] [&_.material-symbols-outlined]:text-[22px]"
          )}
        >
          {item.icon}
          {item.isActive && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-500 shadow-xs"></span>
          )}
        </Tag>
      </motion.div>

      {alwaysShowLabels && (
        <span className="mt-1 text-[10px] font-semibold tracking-tight text-slate-500 whitespace-nowrap pointer-events-none select-none leading-none">
          {item.label}
        </span>
      )}
    </motion.div>
  );
}

export function Dock({
  items,
  magnification = 1.45,
  distance = 110,
  iconSize = 44,
  gap = 6,
  borderRadius = 16,
  alwaysShowLabels = false,
  springOptions = DEFAULT_SPRING,
  className,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const dockRef = React.useRef<HTMLDivElement>(null);

  const iconRefs = React.useRef<React.RefObject<HTMLDivElement>[]>(
    items.map(() => React.createRef<HTMLDivElement>())
  );

  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [tooltipX, setTooltipX] = React.useState(0);
  const [tooltipBottomOffset, setTooltipBottomOffset] = React.useState(0);

  React.useEffect(() => {
    if (hoveredIndex === null) return;

    let raf: number;
    const update = () => {
      const iconEl = iconRefs.current[hoveredIndex]?.current;
      const dockEl = dockRef.current;
      if (iconEl && dockEl) {
        const iconRect = iconEl.getBoundingClientRect();
        const dockRect = dockEl.getBoundingClientRect();
        setTooltipX(iconRect.left - dockRect.left + iconRect.width / 2);
        setTooltipBottomOffset(dockRect.bottom - iconRect.top);
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [hoveredIndex]);

  const handleHover = React.useCallback(
    (ref: React.RefObject<HTMLDivElement> | null) => {
      if (ref === null) {
        setHoveredIndex(null);
        return;
      }
      const idx = iconRefs.current.findIndex((r) => r === ref);
      setHoveredIndex(idx >= 0 ? idx : null);
    },
    []
  );

  return (
    <motion.div
      ref={dockRef}
      role="navigation"
      aria-label="Quick Dock Navigation"
      className={cn(
        "relative flex items-end overflow-visible border border-slate-200/90 bg-white/95 px-3 py-2.5",
        "shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/15 transition-all duration-200 backdrop-blur-xl",
        className
      )}
      style={{ gap, borderRadius }}
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <DockIcon
            item={item}
            mouseX={mouseX}
            magnification={magnification}
            distance={distance}
            iconSize={iconSize}
            borderRadius={borderRadius}
            alwaysShowLabels={alwaysShowLabels}
            springOptions={springOptions}
            onHover={handleHover}
            iconRef={iconRefs.current[i]}
          />
          {item.separator && <DockSeparator />}
        </React.Fragment>
      ))}

      {!alwaysShowLabels && (
        <AnimatePresence>
          {hoveredIndex !== null && items[hoveredIndex] && (
            <motion.div
              key="dock-tooltip"
              layoutId="dock-tooltip"
              className="pointer-events-none absolute flex flex-col items-center z-50"
              style={{
                left: tooltipX,
                bottom: tooltipBottomOffset + 10,
                x: "-50%",
              }}
              initial={{ opacity: 0, y: 6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.94 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
            >
              <span className="rounded-lg border border-slate-700/80 bg-[#0F172A] px-2.5 py-1 text-xs font-semibold text-white shadow-md whitespace-nowrap">
                {items[hoveredIndex].label}
              </span>
              <svg
                width="8"
                height="4"
                viewBox="0 0 8 4"
                className="-mt-px text-[#0F172A]"
                aria-hidden
              >
                <path d="M0 0L4 4L8 0" fill="currentColor" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
