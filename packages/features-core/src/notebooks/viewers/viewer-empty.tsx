"use client"

import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"

/** What a viewer shows when its artifact is ready but carries no content (should not happen; never a blank pane). */
export function ViewerEmpty({ text }: { text?: string }) {
  const t = useT("notebooks")
  return <StateView state="empty" emptyText={text ?? t("viewers.noContent")} className="m-4" />
}
