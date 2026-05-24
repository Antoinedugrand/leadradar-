import type { ReactNode } from "react";

interface AppTopbarProps {
  title: string;
  crumbs?: string[];
  actions?: ReactNode;
}

export function AppTopbar({ title, crumbs, actions }: AppTopbarProps) {
  return (
    <div className="lr-topbar">
      <div>
        {crumbs && crumbs.length > 0 ? (
          <div className="lr-crumbs">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb}-${index}`}>
                {index > 0 ? <span className="sep">/</span> : null}
                <span
                  style={{
                    color: index === crumbs.length - 1 ? "var(--slate-700)" : "inherit",
                  }}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        ) : null}
        <div className="lr-page-title" style={{ marginTop: crumbs?.length ? 4 : 0 }}>
          {title}
        </div>
      </div>
      {actions ? <div className="lr-topbar-actions">{actions}</div> : null}
    </div>
  );
}
