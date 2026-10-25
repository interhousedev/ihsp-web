"use client"

import type { NotebookDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { StudioPanel } from "./panes"

type StudioSectionProps = {
  notebook: NotebookDetail
  onCollapse?: () => void
  hidden?: boolean
  id?: string
}

/** The Studio region around the panel. */
export function StudioSection({ notebook, onCollapse, hidden, id }: StudioSectionProps) {
  const t = useT("notebooks")
  return (
    <section
      id={id}
      aria-label={t("tabs.studio")}
      hidden={hidden}
      className="flex min-h-0 min-w-0 flex-1 flex-col print:hidden"
    >
      <StudioPanel notebook={notebook} {...(onCollapse ? { onCollapse } : {})} />
    </section>
  )
}
