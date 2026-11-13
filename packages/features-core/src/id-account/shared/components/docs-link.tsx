"use client"

import { IconExternalLink } from "@ihsp/ui"
import { useTr } from "../hooks/use-tr"

/** A link to a documentation page in a new tab; renders nothing while the URL is unknown (config loading, failed or unset). */
export function DocsLink({ href, children }: { href: string | null | undefined; children: string }) {
  const t = useTr()
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 items-center gap-1 text-sm underline underline-offset-4 md:min-h-0"
    >
      {children}
      <IconExternalLink aria-hidden className="size-3.5" />
      <span className="sr-only">{t("common.opensInNewTab")}</span>
    </a>
  )
}
