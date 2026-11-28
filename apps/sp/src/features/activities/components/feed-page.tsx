"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  Icons,
  Input,
  PageContainer,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { useClubs, useEvents, useOpportunities } from "../use-activities"
import { ClubLogo, SELECT_CLASS } from "./activity-ui"
import { EventCover } from "./club-media"
import { MyClubRequests, SuggestClubDialog } from "./suggest-club-dialog"

const matches = (query: string, ...fields: (string | null | undefined)[]) =>
  query === "" || fields.some((f) => (f ?? "").toLowerCase().includes(query))

const OPP_PREVIEW = 6
const TYPES = ["all", "club", "event", "opportunity"] as const
const KNOWN_CATEGORIES = ["tech", "sport", "arts", "debate", "volunteering", "academic"] as const

/** "Активности": clubs, events and the opportunities catalogue shared with admission, from the activities API. */
export function FeedPage() {
  const t = useT("activities")
  const common = useT("common")
  const errorMessage = useErrorMessage()
  const fmt = useFormatters()
  const [type, setType] = useState<(typeof TYPES)[number]>("all")
  const [category, setCategory] = useState("")
  const [allOpps, setAllOpps] = useState(false)
  const [search, setSearch] = useState("")
  const [suggestOpen, setSuggestOpen] = useState(false)
  const query = search.trim().toLowerCase()
  const allClubs = useClubs()
  const events = useEvents()
  const opps = useOpportunities()
  const organized = allClubs.clubs.filter(
    (c) => c.status === "active" && (c.myRole === "owner" || c.myRole === "co_owner" || c.myRole === "team"),
  )
  const categories = [...new Set(allClubs.clubs.map((c) => c.category).filter((c): c is string => c !== null))]
  const categoryLabel = (c: string) => ((KNOWN_CATEGORIES as readonly string[]).includes(c) ? t(`categories.${c}`) : c)
  const clubName = new Map(allClubs.clubs.map((c) => [c.id, c.name]))
  const showClubs = type === "all" || type === "club"
  const showEvents = type === "all" || type === "event"
  const showOpps = (type === "all" || type === "opportunity") && category === ""
  const oppItems = (opps.data?.items ?? []).filter(
    (o) =>
      o.lms_course_id === null &&
      matches(query, o.title as string, (o as { description?: string }).description, o.provider, o.host_institution),
  )
  const visibleOpps = allOpps || type === "opportunity" ? oppItems : oppItems.slice(0, OPP_PREVIEW)
  const clubItems = allClubs.clubs.filter(
    (c) =>
      c.status === "active" && (category === "" || c.category === category) && matches(query, c.name, c.description),
  )
  const categoryClubs = new Set(clubItems.map((c) => c.id))
  const eventItems = (events.data?.items ?? []).filter(
    (e) =>
      e.status === "scheduled" &&
      (category === "" || categoryClubs.has(e.club_id)) &&
      matches(
        query,
        e.title as string,
        (e as { description?: string }).description,
        e.location,
        clubName.get(e.club_id),
      ),
  )
  const pending = allClubs.isPending || events.isPending || opps.isPending
  // Each source fails on its own: the rest of the feed stays usable and the error names the reason.
  const failure =
    (showClubs && allClubs.isError ? allClubs.error : null) ??
    (showEvents && events.isError ? events.error : null) ??
    (showOpps && opps.isError ? opps.error : null)
  const filtered = query !== "" || category !== "" || type !== "all"
  const empty =
    !pending &&
    (!showClubs || clubItems.length === 0) &&
    (!showEvents || eventItems.length === 0) &&
    (!showOpps || oppItems.length === 0)

  return (
    <PageContainer
      title={t("title")}
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => setSuggestOpen(true)}>
            <Icons.add data-icon="inline-start" aria-hidden />
            {t("suggest.button")}
          </Button>
          {organized.length === 1 ? (
            <Link
              href={`/activities/manage/?slug=${organized[0].slug}`}
              className={buttonVariants({ variant: "outline" })}
            >
              <Icons.teams data-icon="inline-start" aria-hidden />
              {t("manage")}
            </Link>
          ) : null}
        </>
      }
    >
      <p className="text-muted-foreground max-w-2xl text-sm">{t("description")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={type} onValueChange={(v) => setType(v as (typeof TYPES)[number])}>
          <div className="w-full max-w-full overflow-x-auto overflow-y-hidden py-1 md:w-auto">
            <TabsList className="h-auto min-h-11 w-max min-w-full md:w-fit md:min-w-0">
              {TYPES.map((value) => (
                <TabsTrigger key={value} value={value} className="min-h-11 px-3">
                  {t(`types.${value}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
        {categories.length > 0 ? (
          <select
            className={`${SELECT_CLASS} w-auto`}
            value={category}
            aria-label={t("categoryLabel")}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">{t("allTopics")}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        ) : null}
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          className="h-11 w-full md:h-8 md:w-64"
        />
      </div>
      {organized.length > 1 ? (
        <nav aria-label={t("myClubs")} className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{t("myClubs")}</span>
          {organized.map((c) => (
            <Link
              key={c.id}
              href={`/activities/manage/?slug=${c.slug}`}
              className={buttonVariants({ variant: "outline", size: "sm", className: "min-h-11 md:min-h-8" })}
            >
              <Icons.teams data-icon="inline-start" aria-hidden />
              {c.name}
            </Link>
          ))}
        </nav>
      ) : null}
      <MyClubRequests />
      <SuggestClubDialog open={suggestOpen} onOpenChange={setSuggestOpen} />
      {pending ? (
        <p role="status" className="text-muted-foreground text-sm">
          {common("loading")}
        </p>
      ) : null}
      {failure ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(failure)}
        </p>
      ) : null}

      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {showClubs
          ? clubItems.map((c) => (
              <li key={`c-${c.id}`}>
                <Link href={`/activities/club/?slug=${c.slug}`} className="block h-full">
                  <Card className="hover:bg-accent/40 h-full transition-colors">
                    <CardContent className="flex h-full flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <ClubLogo club={{ name: c.name, logoUrl: c.logoUrl }} />
                        <div className="min-w-0">
                          <Badge variant={c.kind === "su" ? "info" : "neutral"}>
                            {c.kind === "su" ? t("suEvent") : t("types.clubBadge")}
                          </Badge>
                          <p className="mt-1 font-semibold">{c.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {[c.category ? categoryLabel(c.category) : null, t("members", { count: c.memberCount })]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">{c.description}</p>
                      {c.isMine ? (
                        <Badge variant="success" className="mt-auto w-fit">
                          {c.myRole && c.myRole !== "member" ? t(`roles.${c.myRole}`) : t("youAreMember")}
                        </Badge>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))
          : null}
        {showEvents
          ? eventItems.map((e) => (
              <li key={`e-${e.id}`}>
                <Link href={`/activities/event/?id=${e.id}`} className="block h-full">
                  <Card className="hover:bg-accent/40 h-full transition-colors">
                    <CardContent className="flex h-full flex-col gap-2">
                      <EventCover mediaId={e.cover_media_id} />
                      <Badge variant="neutral" className="w-fit">
                        {t("types.event")}
                      </Badge>
                      <p className="font-semibold">{e.title}</p>
                      <p className="text-muted-foreground text-sm">
                        {fmt.dateTime(e.starts_at)}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                      {clubName.get(e.club_id) ? (
                        <p className="text-muted-foreground mt-auto text-xs">{clubName.get(e.club_id)}</p>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))
          : null}
        {showOpps
          ? visibleOpps.map((o) => {
              const deadline = o.registration_deadlines[0]
              const href = o.url
              const body = (
                <Card className={href ? "hover:bg-accent/40 h-full transition-colors" : "h-full"}>
                  <CardContent className="flex h-full flex-col gap-2">
                    <Badge variant="warning" className="w-fit">
                      {t("types.opportunity")}
                    </Badge>
                    <p className="font-semibold">{o.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {[o.provider ?? o.host_institution, o.amount_text].filter(Boolean).join(" · ")}
                    </p>
                    {deadline ? (
                      <Badge variant="neutral" className="mt-auto w-fit">
                        {t("deadline", { date: fmt.date(deadline) })}
                      </Badge>
                    ) : null}
                  </CardContent>
                </Card>
              )
              return (
                <li key={`o-${o.id}`}>
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="block h-full">
                      {body}
                    </a>
                  ) : (
                    body
                  )}
                </li>
              )
            })
          : null}
      </ul>
      {showOpps && type === "all" && !allOpps && oppItems.length > OPP_PREVIEW ? (
        <Button variant="outline" className="w-fit" onClick={() => setAllOpps(true)}>
          {t("showAllOpps", { count: oppItems.length })}
        </Button>
      ) : null}
      {empty && !failure ? (
        <div className="grid justify-items-start gap-2">
          <p className="text-muted-foreground text-sm">{t(filtered ? "empty" : "clubActions.emptyFeed")}</p>
          {filtered ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 md:min-h-8"
              onClick={() => {
                setSearch("")
                setCategory("")
                setType("all")
              }}
            >
              {t("clubActions.resetFilters")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 md:min-h-8"
              onClick={() => setSuggestOpen(true)}
            >
              {t("suggest.button")}
            </Button>
          )}
        </div>
      ) : null}
    </PageContainer>
  )
}
