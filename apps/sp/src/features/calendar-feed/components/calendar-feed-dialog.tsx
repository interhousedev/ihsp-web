"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, ResponsiveDialog } from "@ihsp/ui"
import { useState } from "react"
import { CalendarFeedPanel } from "./calendar-feed-panel"

/** "Subscribe to calendar" button of the Timetable with the feed panel in a dialog (UF-WEB-04). */
export function CalendarFeedDialog() {
  const t = useT("calendarFeed")
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" className="min-h-11 md:min-h-8" onClick={() => setOpen(true)}>
        <Icons.calendarEvent aria-hidden />
        {t("subscribe")}
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title={t("title")} size="md">
        <CalendarFeedPanel />
      </ResponsiveDialog>
    </>
  )
}
