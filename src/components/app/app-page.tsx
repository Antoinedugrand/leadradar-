import type { ReactNode } from "react";

import { AppTopbar } from "@/components/app/app-topbar";

interface AppPageProps {
  title: string;
  crumbs?: string[];
  actions?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  narrow?: boolean;
}

export function AppPage({
  title,
  crumbs,
  actions,
  children,
  contentClassName,
  narrow = true,
}: AppPageProps) {
  return (
    <>
      <AppTopbar title={title} crumbs={crumbs} actions={actions} />
      <div
        className={[
          "lr-content",
          narrow ? "lr-content-narrow" : "",
          contentClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </>
  );
}
