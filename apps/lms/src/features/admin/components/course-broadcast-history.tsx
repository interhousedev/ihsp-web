"use client"

import { getLmsCourseBroadcastsQuery } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Card, CardContent, Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { QueryState } from "../../shared/components/query-state"
import { CourseBroadcastDialog } from "./course-broadcast-dialog"

/** The button that opens the broadcast dialog, and the list of what was already sent to the course. */
export function CourseBroadcastHistory({ courseId }: { courseId: string }) {
  const t = useT("broadcasts")
  const format = useFormatters()
  const history = useQuery(getLmsCourseBroadcastsQuery(courseId))
  const [open, setOpen] = useState(false)

  return (
    <section aria-labelledby="broadcast-history-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="broadcast-history-title" className="text-base font-semibold">
          {t("historyTitle")}
        </h2>
        <Button onClick={() => setOpen(true)} className="ms-auto min-h-11 md:min-h-8">
          <Icons.send aria-hidden />
          {t("open")}
        </Button>
      </div>
      <QueryState query={history} isEmpty={(items) => items.length === 0} emptyText={t("empty")}>
        {(items) => (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.id}>
                <Card>
                  <CardContent className="flex flex-col gap-1">
                    <span className="text-sm font-semibold break-words">{item.title}</span>
                    <p className="text-sm break-words whitespace-pre-line">{item.body}</p>
                    <span className="text-muted-foreground text-xs">{format.dateTime(item.created_at)}</span>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
      {open ? <CourseBroadcastDialog courseId={courseId} open onOpenChange={setOpen} /> : null}
    </section>
  )
}
