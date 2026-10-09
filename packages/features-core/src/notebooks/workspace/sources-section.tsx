"use client"

import type { NotebookDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { SourcesPanel } from "./panes"

type SourcesSectionProps = {
  notebook: NotebookDetail
  onCollapse?: () => void
  hidden?: boolean
  id?: string
}

/** The Sources region around the panel. */
export function SourcesSection({ notebook, onCollapse, hidden, id }: SourcesSectionProps) {
  const t = useT("notebooks")
  return (
    <section
      id={id}
      aria-label={t("tabs.sources")}
      hidden={hidden}
      className="flex min-h-0 min-w-0 flex-1 flex-col print:hidden"
    >
      <SourcesPanel notebook={notebook} {...(onCollapse ? { onCollapse } : {})} />
    </section>
  )
}
