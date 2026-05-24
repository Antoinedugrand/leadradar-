import Link from "next/link";

import { ProspectAvatar } from "@/components/app/prospect-avatar";
import { StatusBadge, type StatusBadgeKind } from "@/components/app/status-badge";
import { ProspectScoreBadge } from "@/components/prospect-score-badge";
import { getDisplayScore } from "@/lib/prospect-scorer";
import type { Prospect } from "@/lib/types";

interface DashboardRecentItemLabels {
  noWebsite: string;
  siteFailing: string;
  siteOk: string;
  statusNew: string;
  statusAudited: string;
  statusContacted: string;
  statusReplied: string;
  statusConverted: string;
  details: string;
}

interface DashboardRecentItemProps {
  prospect: Prospect;
  last?: boolean;
  labels: DashboardRecentItemLabels;
}

function siteStatusKind(
  prospect: Prospect,
  labels: DashboardRecentItemLabels,
): { kind: StatusBadgeKind; label: string } {
  if (!prospect.website_exists) {
    return { kind: "nosite", label: labels.noWebsite };
  }
  const score = getDisplayScore(prospect);
  if (score !== null && score <= 45) {
    return { kind: "pending", label: labels.siteFailing };
  }
  return { kind: "new", label: labels.siteOk };
}

function pipelineBadge(
  prospect: Prospect,
  labels: DashboardRecentItemLabels,
): { kind: StatusBadgeKind; label: string } | null {
  switch (prospect.status) {
    case "emailed":
      return { kind: "contacted", label: labels.statusContacted };
    case "replied":
      return { kind: "replied", label: labels.statusReplied };
    case "converted":
      return { kind: "won", label: labels.statusConverted };
    case "audited":
      return { kind: "new", label: labels.statusAudited };
    case "new":
      return { kind: "new", label: labels.statusNew };
    default:
      return null;
  }
}

export function DashboardRecentItem({ prospect, last = false, labels }: DashboardRecentItemProps) {
  const score = getDisplayScore(prospect);
  const verdict =
    !prospect.website_exists
      ? labels.noWebsite
      : (prospect.audit_summary ??
        (prospect.audit_issues && prospect.audit_issues.length > 0
          ? prospect.audit_issues[0]
          : null));

  const site = siteStatusKind(prospect, labels);
  const pipeline = pipelineBadge(prospect, labels);

  return (
    <div
      className="flex items-start gap-3.5 px-[22px] py-4"
      style={{ borderBottom: last ? "none" : "1px solid var(--slate-100)" }}
    >
      <ProspectAvatar name={prospect.name} score={score} scoreLabel={prospect.score_label} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold text-[var(--slate-900)]">{prospect.name}</div>
          <ProspectScoreBadge prospect={prospect} showEmoji={false} />
          {prospect.type ? <span className="lr-type">{prospect.type}</span> : null}
        </div>
        {prospect.address ? (
          <div className="mb-1.5 text-xs text-[var(--slate-500)]">{prospect.address}</div>
        ) : null}
        {verdict ? (
          <div className="mb-2 line-clamp-2 text-xs italic leading-relaxed text-[var(--slate-600)]">
            « {verdict} »
          </div>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge kind={site.kind} label={site.label} />
          {pipeline && (prospect.status === "emailed" || prospect.status === "replied" || prospect.status === "converted") ? (
            <StatusBadge kind={pipeline.kind} label={pipeline.label} />
          ) : null}
        </div>
      </div>
      <Link
        href={`/prospects/${prospect.id}/detail`}
        className="lr-btn lr-btn-secondary lr-btn-sm shrink-0"
      >
        {labels.details}
      </Link>
    </div>
  );
}
