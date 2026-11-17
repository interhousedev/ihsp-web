"use client"

import { useSession } from "@ihsp/auth"
import { formatDate, useLocale, useT } from "@ihsp/i18n"
import {
  Badge,
  buttonVariants,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Icons,
  Pill,
  Reveal,
  Skeleton,
} from "@ihsp/ui"
import Link from "next/link"
import { useState, type ReactNode } from "react"
import { Carousel, Slide } from "../../../components/lib/carousel"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { ScrollFade } from "../../../components/scroll-fade"
import type { AdmissionMatch as Match, AdmissionMatchStatus as MatchStatus } from "@ihsp/api"
import { useList } from "../../chooser/hooks"
import type { ListEntry } from "../../chooser/types"
import { useCalendar } from "../../deadlines/calendar-api"
import { useMatches } from "../../discover/hooks"
import { STATUS_TONE } from "../../discover/format"
import { useItems, type Item } from "../../items/api"
import { JourneyHero } from "../../journey/journey-hero"
import { useJourney } from "../../journey/api"
import { useReadiness } from "../../readiness/api"
import { ReadinessRing } from "../../readiness/readiness-ring"
import { scoreName, useScoreCatalog, useScores } from "../../test-scores/api"
import { useTasks } from "../../tasks/api"

const HORIZON_DAYS = 30
const SHOWN = 20
const CLUSTER = 4
const DAY_MS = 86_400_000

type Tone = "primary" | "success" | "warning" | "danger" | "neutral"
const CATEGORY_TONES: readonly Tone[] = ["primary", "success", "warning", "danger", "neutral"]

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** A stable tint per category name, so the same category always has the same colour. */
function categoryTone(category: string): Tone {
  let hash = 0
  for (const char of category) hash = (hash * 31 + char.charCodeAt(0)) % 997
  return CATEGORY_TONES[hash % CATEGORY_TONES.length] ?? "neutral"
}

function prettify(value: string): string {
  const text = value.replaceAll("_", " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function isMatchStatus(value: string | null | undefined): value is MatchStatus {
  return value === "safety" || value === "target" || value === "reach"
}

function scoreBar(score: number): string {
  return score >= 80 ? "bg-success" : score >= 40 ? "bg-warning" : "bg-destructive"
}

function Section({
  title,
  icon,
  href,
  children,
}: {
  title: string
  icon: ReactNode
  href?: string
  children: ReactNode
}) {
  const t = useT("home.widgets")
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          {icon}
          {title}
        </h2>
        {href ? (
          <Link
            href={href}
            className="text-muted-foreground hover:text-foreground flex min-h-11 items-center gap-1 text-xs"
          >
            {t("viewAll")}
            <Icons.arrowRight className="size-3" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function Widget({
  title,
  icon,
  href,
  children,
}: {
  title: string
  icon: ReactNode
  href: string
  children: ReactNode
}) {
  const t = useT("home.widgets")
  return (
    <Reveal>
      <Card className="h-full">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            {title}
          </CardTitle>
          <Link
            href={href}
            className="text-muted-foreground hover:text-foreground flex min-h-11 items-center gap-1 text-xs"
          >
            {t("viewAll")}
            <Icons.arrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">{children}</CardContent>
      </Card>
    </Reveal>
  )
}

function Loading() {
  return <Skeleton className="h-10 w-full" />
}

function Empty({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 py-4 text-center text-sm">
      {icon}
      <p>{children}</p>
    </div>
  )
}

/** The top colleges: shortlisted ones that have a match entry first, then the best matches. */
function useTopColleges(): { name: string; logo: string | null }[] {
  const list = useList()
  const matches = useMatches()
  const shortlisted = (list.data ?? []).map((entry) => ({
    name: entry.institution.name,
    logo: entry.institution.logo_url ?? null,
  }))
  const matched = (matches.data?.items ?? []).map((match) => ({ name: match.name, logo: match.logo_url }))
  const seen = new Set<string>()
  return [...shortlisted, ...matched]
    .filter((college) => (seen.has(college.name) ? false : (seen.add(college.name), true)))
    .slice(0, CLUSTER)
}

/** "Made for <name>" with the logos of the colleges the student is closest to. */
export function MadeForHeader() {
  const t = useT("home.dash")
  const { session } = useSession()
  const name = session?.user.first_name
  const colleges = useTopColleges()
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase">
          <Icons.sparkles aria-hidden className="text-primary size-3.5" />
          {t("eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold break-words md:text-3xl">
          {name ? t("madeFor", { name }) : t("madeForFallback")}
        </h1>
      </div>
      {colleges.length > 0 ? (
        <ul aria-label={t("topColleges")} className="flex shrink-0 -space-x-3">
          {colleges.map((college) => (
            <li key={college.name} title={college.name}>
              <LogoAvatar name={college.name} src={college.logo} className="size-10 md:size-12" />
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  )
}

export function ReadinessWidget() {
  const t = useT("home.readiness")
  const readiness = useReadiness()
  return (
    <Reveal>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icons.trendingUp aria-hidden className="text-primary size-4" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {readiness.isPending ? (
            <Skeleton className="h-32 w-full" />
          ) : readiness.isError ? (
            <p className="text-destructive text-sm">{t("loadError")}</p>
          ) : (
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start xl:flex-col xl:items-center">
              <ReadinessRing percent={readiness.data.percent} />
              <ScrollFade maxHeight="16rem" className="w-full">
                <ul className="flex w-full flex-col gap-3 py-1">
                  {readiness.data.components.map((component) => (
                    <li key={component.key} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium">{t(`components.${component.key}`)}</span>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {component.score}% · {t("weight", { weight: component.weight })}
                        </span>
                      </div>
                      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                        <div
                          className={cn(
                            "h-full rounded-full transition-[width] duration-700 ease-out",
                            scoreBar(component.score),
                          )}
                          style={{ width: `${component.score}%` }}
                        />
                      </div>
                      {component.next_action && component.url_path ? (
                        <Link
                          href={component.url_path}
                          className="text-muted-foreground hover:text-foreground flex min-h-11 items-center gap-1 text-xs"
                        >
                          {t(`actions.${component.next_action}`)}
                          <Icons.arrowRight className="size-3" />
                        </Link>
                      ) : (
                        <span className="text-success flex items-center gap-1 text-xs">
                          <Icons.check className="size-3" />
                          {t("done")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollFade>
            </div>
          )}
        </CardContent>
      </Card>
    </Reveal>
  )
}

function ActivityCard({ item }: { item: Item }) {
  const t = useT("home.dash")
  const tItems = useT("items")
  const honor = item.kind === "honor"
  const category = item.category
    ? tItems.has(`${honor ? "recognition" : "category"}.${item.category}`)
      ? tItems(`${honor ? "recognition" : "category"}.${item.category}`)
      : prettify(item.category)
    : t("activities.noCategory")
  const ready = item.status === "ready"
  return (
    <Link
      href="/activities/"
      className="bg-card border-hairline-strong rounded-card hover:border-primary/40 flex h-full flex-col gap-3 border p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <Pill tone={item.category ? categoryTone(item.category) : "neutral"} className="h-6 min-w-0 px-2 text-xs">
          <span className="truncate">{category}</span>
        </Pill>
        <Pill tone={ready ? "success" : "warning"} className="h-6 px-2 text-xs">
          {ready ? t("activities.ready") : t("activities.draft")}
        </Pill>
      </div>
      <p className="line-clamp-2 min-h-10 text-sm font-semibold">{item.title}</p>
      <dl className="text-muted-foreground flex gap-4 text-xs">
        <div>
          <dt className="sr-only">{t("activities.hours")}</dt>
          <dd className="flex items-center gap-1 tabular-nums">
            <Icons.clock aria-hidden className="size-3" />
            {t("activities.hoursValue", { count: item.hours_per_week ?? 0 })}
          </dd>
        </div>
        <div>
          <dt className="sr-only">{t("activities.weeks")}</dt>
          <dd className="flex items-center gap-1 tabular-nums">
            <Icons.calendar aria-hidden className="size-3" />
            {t("activities.weeksValue", { count: item.weeks_per_year ?? 0 })}
          </dd>
        </div>
      </dl>
    </Link>
  )
}

export function ActivitiesCarousel() {
  const t = useT("home.dash")
  const items = useItems("activity")
  return (
    <Section
      title={t("activities.title")}
      icon={<Icons.kanban aria-hidden className="text-primary size-4" />}
      href="/activities/"
    >
      {items.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : (items.data ?? []).length === 0 ? (
        <Empty icon={<Icons.kanban aria-hidden className="size-6" />}>
          {t("activities.empty")}{" "}
          <Link href="/activities/" className="text-foreground underline">
            {t("activities.add")}
          </Link>
        </Empty>
      ) : (
        <Carousel label={t("activities.title")}>
          {(items.data ?? []).map((item) => (
            <Slide key={item.id}>
              <ActivityCard item={item} />
            </Slide>
          ))}
        </Carousel>
      )}
    </Section>
  )
}

function admissionRate(entry: ListEntry, match: Match | undefined): number | null {
  if (match?.admission_rate != null) return match.admission_rate
  const value = entry.institution.facts.acceptance_rate?.value
  return typeof value === "number" ? (value > 1 ? value / 100 : value) : null
}

function CollegeCard({ entry, match }: { entry: ListEntry; match: Match | undefined }) {
  const t = useT("home.dash")
  const discover = useT("discover")
  const place = [entry.institution.city, entry.institution.country].filter(Boolean).join(", ")
  const rate = admissionRate(entry, match)
  const bucket = entry.bucket
  return (
    <div className="bg-card border-hairline-strong rounded-card flex h-full flex-col gap-3 border p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <LogoAvatar name={entry.institution.name} src={entry.institution.logo_url} className="size-10 ring-0" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/chooser/institution/?id=${encodeURIComponent(entry.institution.id)}`}
            className="block truncate text-sm font-semibold hover:underline after:absolute after:inset-0 after:content-['']"
          >
            {entry.institution.name}
          </Link>
          <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
            <Icons.pin aria-hidden className="size-3 shrink-0" />
            <span className="truncate">{place || t("colleges.noLocation")}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        {isMatchStatus(bucket) ? (
          <Pill tone={STATUS_TONE[bucket]} className="h-6 px-2 text-xs">
            {discover(`status.${bucket}`)}
          </Pill>
        ) : (
          <Pill tone="neutral" className="h-6 px-2 text-xs">
            {t("colleges.unsorted")}
          </Pill>
        )}
        <span className="text-muted-foreground text-xs tabular-nums">
          {rate == null ? t("colleges.rateUnknown") : t("colleges.rate", { percent: Math.round(rate * 100) })}
        </span>
      </div>
      <div className="mt-auto flex gap-2">
        <Link
          href={`/chooser/institution/?id=${encodeURIComponent(entry.institution.id)}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-11 flex-1 md:min-h-9")}
        >
          {t("colleges.open")}
        </Link>
        <Link
          href="/chooser/list/"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "min-h-11 flex-1 md:min-h-9")}
        >
          {t("colleges.compare")}
        </Link>
      </div>
    </div>
  )
}

export function CollegesCarousel() {
  const t = useT("home.dash")
  const list = useList()
  const matches = useMatches()
  const byId = new Map((matches.data?.items ?? []).map((match) => [match.university_id, match]))
  const entries = list.data ?? []
  return (
    <Section
      title={t("colleges.title")}
      icon={<Icons.globe aria-hidden className="text-primary size-4" />}
      href="/chooser/list/"
    >
      {list.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : entries.length === 0 ? (
        <Empty icon={<Icons.globe aria-hidden className="size-6" />}>
          {t("colleges.empty")}{" "}
          <Link href="/colleges/discover" className="text-foreground underline">
            {t("colleges.discover")}
          </Link>
        </Empty>
      ) : (
        <Carousel label={t("colleges.title")}>
          {entries.map((entry) => (
            <Slide key={entry.id}>
              <CollegeCard entry={entry} match={byId.get(entry.institution.id)} />
            </Slide>
          ))}
        </Carousel>
      )}
    </Section>
  )
}

export function DeadlinesWidget() {
  const t = useT("home.widgets")
  const [range] = useState(() => {
    const now = Date.now()
    return { now, from: isoDay(new Date(now)), to: isoDay(new Date(now + HORIZON_DAYS * DAY_MS)) }
  })
  const calendar = useCalendar(range.from, range.to)
  const items = (calendar.data?.items ?? []).toSorted((a, b) => a.due_utc.localeCompare(b.due_utc)).slice(0, SHOWN)
  return (
    <Widget
      title={t("deadlines")}
      icon={<Icons.calendar aria-hidden className="text-warning size-4" />}
      href="/deadlines/"
    >
      {calendar.isPending ? (
        <Loading />
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">{t("noDeadlines")}</p>
      ) : (
        <ScrollFade maxHeight="14rem">
          <ul className="flex flex-col gap-2 py-1">
            {items.map((entry) => {
              const days = (Date.parse(entry.due_utc) - range.now) / DAY_MS
              const tone: Tone = days <= 3 ? "danger" : days <= 7 ? "warning" : "neutral"
              return (
                <li key={entry.key} className="flex items-center justify-between gap-2">
                  <span className="truncate">{entry.title}</span>
                  <Pill tone={tone} className="h-6 px-2 text-xs">
                    <Icons.calendar aria-hidden className="size-3" />
                    {formatDate(entry.day, undefined, { day: "numeric", month: "short" })}
                  </Pill>
                </li>
              )
            })}
          </ul>
        </ScrollFade>
      )}
    </Widget>
  )
}

export function TasksWidget() {
  const t = useT("home.widgets")
  const tasks = useTasks()
  const open = (tasks.data?.items ?? [])
    .filter((task) => task.status !== "done")
    .toSorted((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"))
    .slice(0, SHOWN)
  return (
    <Widget title={t("tasks")} icon={<Icons.checks aria-hidden className="text-primary size-4" />} href="/tasks/">
      {tasks.isPending ? (
        <Loading />
      ) : open.length === 0 ? (
        <p className="text-muted-foreground">{t("noTasks")}</p>
      ) : (
        <ScrollFade maxHeight="14rem">
          <ul className="flex flex-col gap-2 py-1">
            {open.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{task.title}</span>
                {task.overdue ? (
                  <Badge variant="destructive">{t("overdue")}</Badge>
                ) : task.deadline ? (
                  <span className="text-muted-foreground shrink-0 text-xs">{formatDate(task.deadline)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </ScrollFade>
      )}
    </Widget>
  )
}

export function ScoresWidget() {
  const t = useT("home.widgets")
  const locale = useLocale()
  const scores = useScores()
  const catalog = useScoreCatalog()
  const received = new Set(
    (scores.data?.entries ?? []).filter((entry) => entry.status === "score_received").map((entry) => entry.id),
  )
  const rows = (scores.data?.summaries ?? []).filter(
    (summary) => summary.best_total != null && summary.best_entry_id && received.has(summary.best_entry_id),
  )
  return (
    <Widget title={t("tests")} icon={<Icons.certificates aria-hidden className="text-success size-4" />} href="/tests/">
      {scores.isPending ? (
        <Loading />
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">{t("noTests")}</p>
      ) : (
        rows.slice(0, 4).map((summary) => {
          const test = catalog.data?.items.find((item) => item.id === summary.test_id)
          return (
            <div key={summary.test_id} className="flex items-center justify-between gap-2">
              <span className="truncate">{test ? scoreName(test.names, locale) : ""}</span>
              <Pill tone="success" className="h-6 px-2 text-xs tabular-nums">
                {t("best", { total: String(summary.best_total) })}
              </Pill>
            </div>
          )
        })
      )}
    </Widget>
  )
}

/** A banner to the chances of the first shortlisted (or best matching) college. */
export function ChancesBanner() {
  const t = useT("home.dash")
  const list = useList()
  const matches = useMatches()
  const target = list.data?.[0]?.institution.id ?? matches.data?.items[0]?.university_id
  const href = target ? `/chooser/institution/?id=${encodeURIComponent(target)}&tab=chances` : "/colleges/discover"
  return (
    <Reveal>
      <div className="bg-primary/10 border-primary/20 rounded-card flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icons.target aria-hidden className="text-primary mt-0.5 size-5 shrink-0" />
          <div>
            <h2 className="text-base font-semibold">{t("chances.title")}</h2>
            <p className="text-muted-foreground text-sm">{t("chances.text")}</p>
          </div>
        </div>
        <Link href={href} className={cn(buttonVariants({ variant: "default" }), "shrink-0")}>
          {t("chances.cta")}
          <Icons.arrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </Reveal>
  )
}

const NEW_HERE = [
  { key: "journey", href: "/journey/", icon: Icons.route, tint: "bg-primary/10 text-primary" },
  { key: "discover", href: "/colleges/discover", icon: Icons.globe, tint: "bg-success-muted text-success" },
  { key: "career", href: "/career/", icon: Icons.sparkles, tint: "bg-warning-muted text-warning" },
] as const

export function NewHere() {
  const t = useT("home.dash")
  const { journey, pending } = useJourney()
  if (pending || (journey && journey.done > 0)) return null
  return (
    <Section title={t("newHere.title")} icon={<Icons.sparkles aria-hidden className="text-primary size-4" />}>
      <ul className="grid gap-3 sm:grid-cols-3">
        {NEW_HERE.map(({ key, href, icon: Icon, tint }) => (
          <li key={key}>
            <Link
              href={href}
              className="bg-card border-hairline-strong rounded-card hover:border-primary/40 flex h-full items-start gap-3 border p-4 shadow-sm"
            >
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", tint)}>
                <Icon aria-hidden className="size-4" />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold">{t(`newHere.${key}.title`)}</span>
                <span className="text-muted-foreground text-xs">{t(`newHere.${key}.text`)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/**
 * The student home dashboard. Desktop: main column plus an aside; tablet: the aside is a two-column grid below the
 * main column; mobile: one column with snap carousels.
 */
export function HomeWidgets() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <JourneyHero />
        <ActivitiesCarousel />
        <CollegesCarousel />
        <ChancesBanner />
        <NewHere />
      </div>
      <aside className="grid content-start gap-4 md:grid-cols-2 xl:grid-cols-1">
        <div className="md:col-span-2 xl:col-span-1">
          <ReadinessWidget />
        </div>
        <DeadlinesWidget />
        <TasksWidget />
        <ScoresWidget />
      </aside>
    </div>
  )
}
