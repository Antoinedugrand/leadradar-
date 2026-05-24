import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AppScrollRegionProps {
  children: ReactNode;
  className?: string;
  /** Full-height panel without scroll (e.g. map). */
  fill?: boolean;
}

export function AppScrollRegion({ children, className, fill = false }: AppScrollRegionProps) {
  return (
    <div className={cn("lr-scroll", fill && "lr-scroll-fill", className)}>{children}</div>
  );
}
