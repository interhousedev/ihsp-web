"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = ["connectors", "pipelines", "requests", "analytics"] as const

/** The four pages of the AI harness as one row of links. */
export function HarnessTabs() {
  const t = useT("aiHarness.tabs")
  const pathname = usePathname()
  const labels = {
    connectors: t("connectors"),
    pipelines: t("pipelines"),
    requests: t("requests"),
    analytics: t("analytics"),
  }
  return (
    <nav aria-label={t("label")} className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active = pathname.startsWith(`/ai/${tab}`)
        return (
          <Link
            key={tab}
            href={`/ai/${tab}/`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-sm md:min-h-8",
              active ? "bg-primary text-primary-foreground border-transparent" : "hover:bg-muted",
            )}
          >
            {labels[tab]}
          </Link>
        )
      })}
    </nav>
  )
}
