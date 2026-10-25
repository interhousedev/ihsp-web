"use client"

import type { FeedbackArea } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import type { UserMenuItem } from "@ihsp/ui"
import { useState, type ReactNode } from "react"
import { FeedbackDialog } from "./feedback-dialog"

export type UseFeedbackMenuOptions = {
  /** The app's section, preselected in the dialog. */
  area: FeedbackArea
  /** Adds a "My feedback" item linking to the app's list of reports (only apps that have that page). */
  mineHref?: string
}

/**
 * Profile-menu entries for feedback: "Suggest an idea or report a problem" opens the dialog, and optionally "My
 * feedback" links to the list. Render `dialog` next to the menu; it stays closed until the item is chosen.
 */
export function useFeedbackMenu({ area, mineHref }: UseFeedbackMenuOptions): {
  items: UserMenuItem[]
  dialog: ReactNode
} {
  const t = useT("feedback")
  const [open, setOpen] = useState(false)
  const items: UserMenuItem[] = [
    { key: "feedback-suggest", title: t("menu.suggest"), icon: "help", onSelect: () => setOpen(true) },
    ...(mineHref ? [{ key: "feedback-mine", title: t("menu.mine"), icon: "inbox" as const, href: mineHref }] : []),
  ]
  return {
    items,
    dialog: <FeedbackDialog open={open} onOpenChange={setOpen} defaultArea={area} />,
  }
}
