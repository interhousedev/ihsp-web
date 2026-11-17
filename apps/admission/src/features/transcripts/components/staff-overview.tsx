"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, Skeleton, StateView, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { useRemindTranscript, useStaffTranscripts } from "../api"
import { TranscriptStatus } from "./transcript-status"
import { QueryError } from "../../shell/components/query-error"

const FILTERS = ["requested", "ready", "cancelled"] as const

/** Caseload staff's view of transcript requests, with a reminder to the officer. */
export function StaffOverview() {
  const t = useT("transcripts")
  const { date } = useFormatters()
  const errorMessage = useErrorMessage()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("requested")
  const query = useStaffTranscripts(filter)
  const remind = useRemindTranscript()
  let body
  if (query.isPending) body = <Skeleton className="h-24 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (query.data.length === 0) body = <StateView state="empty" title={t("overviewEmpty")} />
  else
    body = (
      <ul className="flex flex-col gap-2">
        {query.data.map((item) => (
          <li
            key={item.id}
            className="bg-card flex flex-wrap items-center justify-between gap-2 rounded-card border p-3"
          >
            <div className="flex flex-col">
              <span className="font-medium">{item.student_name}</span>
              <span className="text-muted-foreground text-xs">
                {[item.class_name, item.requested_at ? date(item.requested_at) : null].filter(Boolean).join(" · ")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TranscriptStatus status={item.status} />
              {item.status === "requested" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={remind.isPending}
                  onClick={() =>
                    remind.mutate(item.id, {
                      onSuccess: () => toast.success(t("reminded")),
                      onError: (error) => toast.error(errorMessage(error)),
                    })
                  }
                >
                  {t("remind")}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    )
  return (
    <>
      <Tabs value={filter} onValueChange={(value) => setFilter(value as (typeof FILTERS)[number])}>
        <TabsList>
          {FILTERS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {t(`status.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {body}
    </>
  )
}
