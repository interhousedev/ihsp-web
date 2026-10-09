"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { useWorkspace } from "../../workspace-context"

export type SourcesLineProps = {
  /** `notebook.selected_source_count` */
  count: number
  /** Closes the dialog; the Sources tab is shown behind it. */
  onNavigate: () => void
}

/** "Using 3 sources" with a link to the Sources tab, where the selection is changed. */
export function SourcesLine({ count, onNavigate }: SourcesLineProps) {
  const t = useT("notebooks.opt")
  const workspace = useWorkspace()
  return (
    <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-sm">
      <span>{t("using", { count })}</span>
      <Button
        type="button"
        variant="link"
        className="min-h-11 px-1 md:min-h-8"
        onClick={() => {
          workspace.showTab("sources")
          onNavigate()
        }}
      >
        {t("sourcesChange")}
      </Button>
    </p>
  )
}
