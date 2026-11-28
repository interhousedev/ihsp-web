"use client"

import { useT } from "@ihsp/i18n"
import {
  Badge,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  StateView,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  UserAvatar,
} from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import {
  useGroupRankings,
  type GroupStanding as Standing,
  type Place,
  type RankMetric,
  type RankScope,
  type TopRow,
} from "../api/group-standing"

function formatValue(metric: RankMetric, value: number | null, empty: string): string {
  if (value === null) return empty
  return metric === "attendance" ? `${Math.round(value)}%` : value.toFixed(2)
}

function TopList({ rows, metric }: { rows: TopRow[]; metric: RankMetric }) {
  const t = useT("groupStanding")
  if (rows.length === 0) return <p className="text-muted-foreground py-3 text-sm">{t("topEmpty")}</p>
  return (
    <ol className="flex flex-col gap-1">
      {rows.map((row) => (
        <li
          key={row.student_id}
          aria-current={row.is_me ? "true" : undefined}
          className={`flex min-h-12 items-center gap-3 rounded-lg px-2 py-1.5 ${row.is_me ? "bg-primary/10 ring-primary/40 ring-1" : ""}`}
        >
          <span className="text-muted-foreground w-6 shrink-0 text-right text-sm font-semibold tabular-nums">
            {row.rank}
          </span>
          <UserAvatar name={row.full_name} imageUrl={row.photo_url} placeholder="person" className="size-9 text-xs" />
          <span className="min-w-0 flex-1 break-words text-sm">{row.full_name}</span>
          {row.is_me ? <Badge variant="outline">{t("you")}</Badge> : null}
          <span className="shrink-0 text-sm font-semibold tabular-nums">
            {formatValue(metric, row.value, t("noValue"))}
          </span>
        </li>
      ))}
    </ol>
  )
}

/** Top students of the group, by grades or by attendance; the student's own row is highlighted. */
export function GroupTopSection({ standing }: { standing: Standing }) {
  const t = useT("groupStanding")
  return (
    <section aria-labelledby="group-top" className="bg-card flex flex-col gap-2 rounded-card border p-4">
      <h2 id="group-top" className="text-base font-semibold">
        {t("topTitle")}
      </h2>
      <p className="text-muted-foreground text-sm">{t("topHint")}</p>
      <Tabs defaultValue="gpa">
        <TabsList>
          <TabsTrigger value="gpa">{t("byGrade")}</TabsTrigger>
          <TabsTrigger value="attendance">{t("byAttendance")}</TabsTrigger>
        </TabsList>
        <TabsContent value="gpa">
          <TopList rows={standing.top_by_grade ?? []} metric="gpa" />
        </TabsContent>
        <TabsContent value="attendance">
          <TopList rows={standing.top_by_attendance ?? []} metric="attendance" />
        </TabsContent>
      </Tabs>
    </section>
  )
}

function RankingSheet({
  open,
  onOpenChange,
  scope,
  metric,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  scope: RankScope
  metric: RankMetric
}) {
  const t = useT("groupStanding")
  const query = useGroupRankings(scope, metric, open)
  const items = query.data?.items
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {t("rankingTitle")} · {t(scope === "course" ? "rankingScopeCourse" : "rankingScopeLyceum")} ·{" "}
            {t(metric === "gpa" ? "gpa" : "attendance")}
          </SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-24">
          {items ? (
            <ol className="flex flex-col gap-1">
              {items.map((item) => (
                <li
                  key={item.group_id}
                  aria-current={item.is_mine ? "true" : undefined}
                  className={`flex min-h-12 items-center gap-3 rounded-lg px-2 py-1.5 ${item.is_mine ? "bg-primary/10 ring-primary/40 ring-1" : ""}`}
                >
                  <span className="text-muted-foreground w-6 shrink-0 text-right text-sm font-semibold tabular-nums">
                    {item.place}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="break-words text-sm font-medium">{item.group_name}</span>
                    <span className="text-muted-foreground text-xs">
                      {item.course !== null ? `${t("course", { course: item.course })} · ` : ""}
                      {t("members", { count: item.members_count })}
                    </span>
                  </span>
                  {item.is_mine ? <Badge variant="outline">{t("mine")}</Badge> : null}
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatValue(metric, item.value, t("noValue"))}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <StateView
              state={query.isError ? "error" : "loading"}
              error={query.error}
              onRetry={() => void query.refetch()}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Per metric (grades / attendance): the group's place among its course and among the whole lyceum. */
export function GroupRanksSection({ standing }: { standing: Standing }) {
  const t = useT("groupStanding")
  const [open, setOpen] = useState<{ scope: RankScope; metric: RankMetric } | null>(null)
  const [last, setLast] = useState<{ scope: RankScope; metric: RankMetric }>({ scope: "course", metric: "gpa" })
  const ranks = standing.ranks
  if (!ranks) return null

  const placeButton = (scope: RankScope, metric: RankMetric, place: Place | null) => {
    if (!place) return null
    const label = t(scope === "course" ? "scopeCourse" : "scopeLyceum")
    return (
      <button
        key={scope}
        type="button"
        aria-label={`${label}: ${t("placeAria", { place: place.place, total: place.total })}`}
        onClick={() => {
          setLast({ scope, metric })
          setOpen({ scope, metric })
        }}
        className="hover:bg-muted/60 focus-visible:ring-ring flex min-h-14 w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="text-muted-foreground min-w-0 text-sm">{label}</span>
        <span className="flex shrink-0 flex-col items-end leading-tight">
          <span className="text-lg font-bold tabular-nums">{t("placeNumber", { place: place.place })}</span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {t("placeOfTotal", { total: place.total })}
          </span>
        </span>
      </button>
    )
  }

  const card = (metric: RankMetric) => {
    const course = ranks.course[metric]
    const lyceum = ranks.lyceum[metric]
    if (!course && !lyceum) return null
    return (
      <div key={metric} className="bg-background flex flex-col gap-1 rounded-lg border p-3">
        <h3 className="text-sm font-semibold">{t(metric)}</h3>
        <p className="text-muted-foreground text-xs">{t(metric === "gpa" ? "gpaHint" : "attendanceHint")}</p>
        <div className="divide-y">
          {placeButton("course", metric, course)}
          {placeButton("lyceum", metric, lyceum)}
        </div>
      </div>
    )
  }

  return (
    <section aria-labelledby="group-ranks" className="bg-card flex flex-col gap-3 rounded-card border p-4">
      <div className="flex flex-col gap-1">
        <h2 id="group-ranks" className="text-base font-semibold">
          {t("ranksTitle")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("ranksHint")}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {card("gpa")}
        {card("attendance")}
      </div>
      <RankingSheet
        open={open !== null}
        onOpenChange={(next) => {
          if (!next) setOpen(null)
        }}
        scope={open?.scope ?? last.scope}
        metric={open?.metric ?? last.metric}
      />
    </section>
  )
}

/** Link card to the overall lyceum rating. */
export function LyceumRatingLink() {
  const t = useT("groupStanding")
  return (
    <Link
      href="/rating/"
      className="bg-card hover:bg-muted/50 focus-visible:ring-ring flex min-h-14 items-center justify-between gap-3 rounded-card border p-4 focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-semibold">{t("ratingLinkTitle")}</span>
        <span className="text-muted-foreground text-sm">{t("ratingLinkHint")}</span>
      </span>
      <span aria-hidden className="text-muted-foreground text-xl">
        ›
      </span>
    </Link>
  )
}
