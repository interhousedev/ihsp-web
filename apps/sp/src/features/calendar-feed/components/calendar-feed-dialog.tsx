"use client"

import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Icons } from "@ihsp/ui"
import { CalendarFeedPanel } from "./calendar-feed-panel"

/** "Subscribe to calendar" button of the Timetable with the feed panel in a dialog (UF-WEB-04). */
export function CalendarFeedDialog() {
  const t = useT("calendarFeed")
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" className="min-h-11 md:min-h-8" />}>
        <Icons.calendarEvent aria-hidden />
        {t("subscribe")}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <CalendarFeedPanel />
      </DialogContent>
    </Dialog>
  )
}
