"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icons,
  Label,
  PageContainer,
  ResponsiveDialog,
  Textarea,
} from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import type { FormField, TeamPosition } from "../api/activities-api"
import {
  useApply,
  useClub,
  useClubEvents,
  useClubRatings,
  useJoinClub,
  usePositions,
  usePublicClub,
  useRateClub,
} from "../use-activities"
import { TransferBanner } from "./club-admin"
import { ClubCourses, Leaderboard, MemberDraft, MemberForm } from "./club-capabilities"
import { ApplyField, ClubLogo, PersonAvatar, Section, SectionTabs, Stars } from "./activity-ui"

const ASPECTS = ["organization", "usefulness", "atmosphere"] as const

/** Club page: description, team, open positions, events, join and rate. Everything comes from the activities API. */
export function ClubPage() {
  const t = useT("activities")
  const common = useT("common")
  const errorMessage = useErrorMessage()
  const fmt = useFormatters()
  const params = useSearchParams()
  const slug = params.get("slug")
  const { club, detail, viewer, isPending, isError, error } = useClub(slug, params.get("id"))
  const clubId = club?.id ?? ""
  const publicPage = usePublicClub(club?.slug ?? slug)
  const events = useClubEvents(clubId)
  const positions = usePositions(clubId)
  const ratings = useClubRatings(viewer.isMember ? clubId : "")
  const { join, leave } = useJoinClub(clubId)
  const apply = useApply()
  const rate = useRateClub(clubId)
  const [tabRaw, setTab] = useState(params.get("tab") ?? "about")
  const [applying, setApplying] = useState<TeamPosition | null>(null)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [applied, setApplied] = useState<string | null>(null)
  const [rating, setRating] = useState(false)
  const [score, setScore] = useState<Record<string, number>>({})
  const [comment, setComment] = useState("")
  const [anonymous, setAnonymous] = useState(true)
  const [rated, setRated] = useState(false)

  const back = (
    <Link href="/activities/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
      <Icons.chevronLeft data-icon="inline-start" aria-hidden />
      {t("back")}
    </Link>
  )
  if (isPending) return <PageContainer title={common("loading")} back={back}>{null}</PageContainer>
  if (!club) {
    return (
      <PageContainer title={t("title")} back={back}>
        <p role="alert" className="text-muted-foreground text-sm">
          {isError ? errorMessage(error) : t("empty")}
        </p>
      </PageContainer>
    )
  }

  const isMember = viewer.isMember
  const requested = viewer.requested || join.data?.status === "requested"
  const eventList = events.data?.items ?? []
  const nextEvent = eventList[0]
  const hasForms = isMember && club.capabilities.includes("forms")
  const tabs = [
    { value: "about", label: t("clubTabs.about") },
    { value: "events", label: t("clubTabs.events") },
    ...(hasForms ? [{ value: "forms", label: t("clubTabs.forms") }] : []),
    ...(isMember && club.capabilities.includes("points") ? [{ value: "points", label: t("clubTabs.points") }] : []),
    { value: "courses", label: t("clubTabs.courses") },
  ]
  const tab = tabs.some((x) => x.value === tabRaw) ? tabRaw : "about"
  const team = publicPage.data?.team ?? []
  const openPositions = (positions.data?.items ?? []).filter((p) => p.open_for_applications)
  const summary = ratings.data?.club

  const submitApplication = () => {
    if (!applying) return
    apply.mutate(
      { positionId: applying.id, answers },
      {
        onSuccess: () => {
          setApplied(applying.title)
          setApplying(null)
          setAnswers({})
        },
      },
    )
  }
  const submitRating = () => {
    const values = Object.values(score)
    if (values.length === 0) return
    const overall = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    rate.mutate(
      { score: overall, aspects: score, comment: comment.trim() || null, anonymous_to_club: anonymous },
      {
        onSuccess: () => {
          setRated(true)
          setRating(false)
        },
      },
    )
  }

  return (
    <PageContainer
      title={club.name}
      back={back}
      actions={
        <>
          {viewer.isStaff ? (
            <Link href={`/activities/manage/?slug=${club.slug}`} className={buttonVariants({ variant: "outline" })}>
              <Icons.edit data-icon="inline-start" aria-hidden />
              {t("manage")}
            </Link>
          ) : null}
          {viewer.isStaff ? null : isMember && !requested ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>
                <Icons.check data-icon="inline-start" aria-hidden />
                {t("youAreMember")}
                <Icons.chevronDown data-icon="inline-end" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem variant="destructive" className="min-h-11 md:min-h-8" onClick={() => leave.mutate()}>
                  {t("leave")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : requested ? (
            <Button variant="outline" disabled>
              {t("requestSent")}
            </Button>
          ) : club.joinPolicy === "invite" ? (
            <Button type="button" disabled>
              {t("byInvite")}
            </Button>
          ) : (
            <Button type="button" disabled={join.isPending} onClick={() => join.mutate(undefined)}>
              {club.joinPolicy === "open" ? t("join") : t("requestJoin")}
            </Button>
          )}
        </>
      }
    >
      <div className="flex items-center gap-4">
        <ClubLogo club={{ name: club.name, logoUrl: club.logoUrl }} size="lg" />
        <div className="min-w-0">
          <p className="text-muted-foreground">{club.description}</p>
          {summary && summary.count > 0 && summary.avg !== null ? (
            <div className="mt-2 text-sm">
              <Stars value={summary.avg} count={summary.count} />
            </div>
          ) : null}
        </div>
      </div>

      {join.isError || leave.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(join.error ?? leave.error)}
        </p>
      ) : null}
      {requested ? (
        <Alert role="status">
          <Icons.info aria-hidden />
          <AlertTitle>{t("requestSentTitle")}</AlertTitle>
          <AlertDescription>{t("requestSentBody")}</AlertDescription>
        </Alert>
      ) : null}

      {params.get("transfer") ? <TransferBanner transferId={params.get("transfer") ?? ""} /> : null}

      <SectionTabs tabs={tabs} value={tab} onChange={setTab}>
        {tab === "about" ? (
          <div className="mt-4 flex flex-col gap-8">
            {detail && (detail.goals || detail.rules || detail.schedule) ? (
              <div className="grid gap-3 md:grid-cols-3">
                {([["goals", detail.goals], ["rules", detail.rules], ["schedule", detail.schedule]] as const).map(([key, text]) =>
                  text ? (
                    <Card key={key}>
                      <CardContent className="grid gap-1">
                        <p className="text-muted-foreground text-xs font-medium uppercase">{t(key === "schedule" ? "when" : key)}</p>
                        <p className="text-sm whitespace-pre-line">{text}</p>
                      </CardContent>
                    </Card>
                  ) : null,
                )}
              </div>
            ) : null}
            {detail?.partners?.length ? (
              <Section title={t("clubTabs.partners")}>
                <ul className="flex flex-wrap gap-2">
                  {detail.partners.map((p) => (
                    <li key={p}>
                      <Badge variant="neutral">{p}</Badge>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}
            {nextEvent || hasForms ? (
              <div className="grid gap-3 md:grid-cols-2">
                {nextEvent ? (
                  <Link href={`/activities/event/?id=${nextEvent.id}`} className="block">
                    <Card className="hover:bg-accent/40 h-full transition-colors">
                      <CardContent className="grid gap-1">
                        <p className="text-muted-foreground text-xs font-medium uppercase">{t("nextEvent")}</p>
                        <p className="font-semibold">{nextEvent.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {fmt.dateTime(nextEvent.starts_at)}
                          {nextEvent.location ? ` · ${nextEvent.location}` : ""}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ) : null}
                {hasForms ? (
                  <Card className="bg-primary/10 border-primary/30">
                    <CardContent className="grid gap-2">
                      <p className="font-semibold">{t("fillFormTitle")}</p>
                      <p className="text-muted-foreground text-sm">{t("fillFormBody")}</p>
                      <Button type="button" size="sm" className="w-fit" onClick={() => setTab("forms")}>
                        {t("fillFormAction")}
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : null}

            <Section title={t("clubTabs.team")}>
              {team.length === 0 ? <p className="text-muted-foreground text-sm">{t("noTeam")}</p> : null}
              <ul className="grid gap-3 md:grid-cols-2">
                {team.map((seat) => (
                  <li key={`${seat.name}-${seat.position}`} className="min-w-0">
                    <Card>
                      <CardContent className="grid gap-3">
                        <div className="flex items-center gap-3">
                          <PersonAvatar person={{ name: seat.name }} size={52} />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{seat.name}</p>
                            <p className="text-muted-foreground text-sm">{seat.position}</p>
                          </div>
                        </div>
                        {seat.bio ? <p className="text-sm">{seat.bio}</p> : null}
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </Section>

            {openPositions.length > 0 ? (
              <Section title={t("openPositions")} hint={t("openPositionsHint")}>
                {applied ? (
                  <Alert role="status">
                    <Icons.circleCheck aria-hidden />
                    <AlertTitle>{t("applied")}</AlertTitle>
                    <AlertDescription>{t("appliedBody", { position: applied })}</AlertDescription>
                  </Alert>
                ) : null}
                <ul className="grid gap-3 md:grid-cols-2">
                  {openPositions.map((pos) => (
                    <li key={pos.id}>
                      <Card className="h-full">
                        <CardContent className="flex h-full flex-col gap-2">
                          <p className="font-semibold">{pos.title}</p>
                          <p className="text-muted-foreground text-sm">{pos.description}</p>
                          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                            <span className="text-muted-foreground text-sm">{t("slots", { count: pos.slots })}</span>
                            <Button type="button" size="sm" disabled={applied === pos.title || !isMember} onClick={() => setApplying(pos)}>
                              {t("apply")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {isMember ? (
              <Section title={t("clubTabs.ratings")}>
                <Card>
                  <CardContent className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-3xl font-semibold tabular-nums">{summary?.avg != null ? summary.avg.toFixed(1) : "–"}</p>
                        <p className="text-muted-foreground text-sm">{t("ratingsCount", { count: summary?.count ?? 0 })}</p>
                      </div>
                      <Button type="button" variant="outline" disabled={rated} onClick={() => setRating(true)}>
                        <Icons.sparkles data-icon="inline-start" aria-hidden />
                        {rated ? t("rated") : t("rate")}
                      </Button>
                    </div>
                    <ul className="grid gap-2">
                      {ASPECTS.filter((a) => summary?.aspects[a] !== undefined).map((a) => {
                        const value = summary?.aspects[a] ?? 0
                        return (
                          <li key={a} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-3 text-sm">
                            <span>{t(`aspects.${a}`)}</span>
                            <span className="bg-muted h-2 overflow-hidden rounded-full">
                              <span className="bg-primary block h-full" style={{ width: `${value * 20}%` }} />
                            </span>
                            <span className="tabular-nums">{value.toFixed(1)}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </CardContent>
                </Card>
              </Section>
            ) : null}
          </div>
        ) : null}

        {tab === "events" ? (
          <div className="mt-4 grid gap-6">
            {eventList.length === 0 ? <p className="text-muted-foreground text-sm">{t("noEvents")}</p> : null}
            <ul className="grid gap-3 md:grid-cols-2">
              {eventList.map((e) => (
                <li key={e.id}>
                  <Link href={`/activities/event/?id=${e.id}`} className="block">
                    <Card className="hover:bg-accent/40 transition-colors">
                      <CardContent className="grid gap-1">
                        <p className="font-semibold">{e.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {fmt.dateTime(e.starts_at)}
                          {e.location ? ` · ${e.location}` : ""}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
            {isMember && club.capabilities.includes("drafting") ? (
              <Section title={t("clubTabs.drafting")}>
                <MemberDraft clubId={club.id} userId={viewer.userId} />
              </Section>
            ) : null}
          </div>
        ) : null}
        {tab === "forms" ? (
          <div className="mt-4">
            <MemberForm clubId={club.id} />
          </div>
        ) : null}
        {tab === "points" ? (
          <div className="mt-4">
            <Leaderboard clubId={club.id} withMine />
          </div>
        ) : null}
        {tab === "courses" ? (
          <div className="mt-4">
            <ClubCourses clubId={club.id} canManage={false} />
          </div>
        ) : null}
      </SectionTabs>

      <ResponsiveDialog
        open={applying !== null}
        onOpenChange={(open) => !open && setApplying(null)}
        title={applying ? t("applyTitle", { position: applying.title }) : ""}
        description={t("applyDescription")}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setApplying(null)}>
              {t("cancel")}
            </Button>
            <Button type="button" disabled={apply.isPending} onClick={submitApplication}>
              {t("send")}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          {(applying?.form_schema.fields ?? []).map((field) => (
            <ApplyField key={field.key} field={field} value={answers[field.key]} onChange={(v) => setAnswers((a) => ({ ...a, [field.key]: v }))} />
          ))}
          {apply.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(apply.error)}
            </p>
          ) : null}
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={rating}
        onOpenChange={setRating}
        title={t("rateTitle", { name: club.name })}
        description={t("rateDescription")}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setRating(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" disabled={rate.isPending || Object.keys(score).length === 0} onClick={submitRating}>
              {t("send")}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          {ASPECTS.map((a) => (
            <div key={a} className="grid gap-1.5">
              <Label>{t(`aspects.${a}`)}</Label>
              <div className="flex gap-1" role="radiogroup" aria-label={t(`aspects.${a}`)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={score[a] === n}
                    onClick={() => setScore((s) => ({ ...s, [a]: n }))}
                    className={`flex size-11 items-center justify-center rounded-lg border text-sm font-medium md:size-9 ${(score[a] ?? 0) >= n ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="grid gap-1.5">
            <Label>{t("comment")}</Label>
            <Textarea rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="size-4" />
            {t("anonymous")}
          </label>
          {rate.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(rate.error)}
            </p>
          ) : null}
        </div>
      </ResponsiveDialog>
    </PageContainer>
  )
}
