import type { AnchorHTMLAttributes, ReactNode } from "react";

import { normalizeWebsiteUrl } from "@/lib/normalize-website-url";
import { cn } from "@/lib/utils";

interface ExternalWebsiteLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  url: string | null | undefined;
  children: ReactNode;
}

export function ExternalWebsiteLink({
  url,
  children,
  className,
  ...props
}: ExternalWebsiteLinkProps) {
  const href = url ? normalizeWebsiteUrl(url) : null;

  if (!href) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(className)}
      {...props}
    >
      {children}
    </a>
  );
}
