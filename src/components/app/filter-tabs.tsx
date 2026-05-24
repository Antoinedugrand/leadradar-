"use client";

import { cn } from "@/lib/utils";

export interface FilterTabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface FilterTabsProps<T extends string> {
  active: T;
  items: FilterTabItem<T>[];
  onChange?: (id: T) => void;
  className?: string;
}

export function FilterTabs<T extends string>({
  active,
  items,
  onChange,
  className,
}: FilterTabsProps<T>) {
  return (
    <div className={cn("lr-tabs", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cn("lr-tab", active === item.id && "active")}
          onClick={() => onChange?.(item.id)}
        >
          {item.label}
          {item.count !== undefined ? (
            <span className="lr-tab-count">{item.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
