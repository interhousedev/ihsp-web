"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, Icons, Label, Switch, Textarea } from "@ihsp/ui"
import { useEffect, useState } from "react"
import type { ClubCapability, FormField } from "../api/activities-api"
import {
  useCapabilities,
  useClubCourses,
  useClubFormFields,
  useClubMembers,
  useCreateRound,
  useClubEvents,
  useCourseLinkActions,
  useDraftActions,
  useDraftRounds,
  useLeaderboard,
  useLeaderboardOptOut,
  useMyPoints,
  useMyProfile,
  useRanking,
  useSaveProfile,
} from "../use-activities"
import { ApplyField, SELECT_CLASS } from "./activity-ui"

export const CAPABILITIES: ClubCapability[] = ["forms", "drafting", "points", "roster"]
const FORM_FIELDS = ["availability", "skills", "languages", "about"] as const

/** The member's reusable form of one club: the club's own fields (`/form-fields`), or four plain questions when it has none. */
export function MemberForm({ clubId }: { clubId: string }) {
  const t = useT("activities")
  const common = useT("common")
  const errorMessage = useErrorMessage()
  const profile = useMyProfile(clubId)
  const defs = useClubFormFields(clubId)
  const save = useSaveProfile(clubId)
  const [values, setValues] = useState<Record<string, unknown>>({})
  useEffect(() => setValues(profile.data?.answers ?? {}), [profile.data])
  if (profile.isPending || defs.isPending) return <p className="text-muted-foreground text-sm">{common("loading")}</p>
  const own = (defs.data?.fields ?? []) as FormField[]
  const fields: FormField[] = own.length > 0 ? own : FORM_FIELDS.map((key) => ({ key, type: "text", label: t(`form.${key}`) }))
  return (
    <Card>
      <CardContent className="grid gap-4">
        <p className="text-muted-foreground text-sm">{t("form.hint")}</p>
        {fields.map((field) => (
          <ApplyField key={field.key} field={field} value={values[field.key]} onChange={(v) => setValues((s) => ({ ...s, [field.key]: v }))} />
        ))}
        <div className="flex items-center gap-3">
          <Button type="button" disabled={save.isPending} onClick={() => save.mutate(values)}>
            {common("save")}
          </Button>
          {save.isSuccess ? <span role="status" className="text-sm">{common("saved")}</span> : null}
        </div>
        {save.isError ? <p role="alert" className="text-destructive text-sm">{errorMessage(save.error)}</p> : null}
      </CardContent>
    </Card>
  )
}

/** Drafting rounds of the club the member can sign up for or answer invitations in. */
export function MemberDraft({ clubId, userId }: { clubId: string; userId: string | null }) {
  const t = useT("activities")
  const errorMessage = useErrorMessage()
  const rounds = useDraftRounds(clubId)
  const { signup, respond } = useDraftActions(clubId)
  const items = rounds.data?.items ?? []
  if (rounds.isPending) return null
  if (items.length === 0) return <p className="text-muted-foreground text-sm">{t("noEvents")}</p>
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {items.map((round) => (
        <li key={round.id}>
          <Card>
            <CardContent className="grid gap-2">
              <Badge variant={round.status === "open" ? "success" : "neutral"} className="w-fit">
                {round.status === "open" ? t("draft.open") : t("draft.closed")}
              </Badge>
              {Object.entries(round.needed).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {role} · {t("draft.need", { count })}
                  </span>
                  <Button type="button" size="sm" disabled={round.status !== "open" || signup.isPending || !round.id || !userId} onClick={() => round.id && signup.mutate({ roundId: round.id, role })}>
                    {t("draft.signUp")}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </li>
      ))}
      {signup.isError || respond.isError ? <p role="alert" className="text-destructive text-sm">{errorMessage(signup.error ?? respond.error)}</p> : null}
    </ul>
  )
}

/** Club points leaderboard; with `withMine` the member sees their own total and may opt out of the board. */
export function Leaderboard({ clubId, withMine = false }: { clubId: string; withMine?: boolean }) {
  const t = useT("activities")
  const common = useT("common")
  const board = useLeaderboard(clubId)
  const mine = useMyPoints(withMine ? clubId : "")
  const optOut = useLeaderboardOptOut()
  const [out, setOut] = useState(false)
  if (board.isPending) return <p className="text-muted-foreground text-sm">{common("loading")}</p>
  const rows = board.data?.items ?? []
  return (
    <div className="grid gap-4">
      {withMine && mine.data ? (
        <Card>
          <CardContent className="grid gap-1">
            <p className="text-3xl font-semibold tabular-nums">{t("leaderboard.yourPoints", { count: mine.data.total })}</p>
            <ul className="text-muted-foreground text-sm">
              {mine.data.entries.slice(0, 5).map((e) => (
                <li key={`${e.at}-${e.reason}`}>
                  +{e.points} · {e.reason}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
      {rows.length === 0 ? <p className="text-muted-foreground text-sm">{t("leaderboard.empty")}</p> : null}
      <ol className="grid gap-2">
        {rows.map((r) => (
          <li key={`${r.rank}-${r.display_name}`}>
            <Card>
              <CardContent className="flex items-center justify-between gap-3">
                <span>
                  <span className="text-muted-foreground me-2 tabular-nums">{r.rank}</span>
                  {r.display_name}
                </span>
                <span className="tabular-nums">{t("leaderboard.points", { count: r.points })}</span>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
      {withMine ? (
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <Switch checked={out} onCheckedChange={(v) => { setOut(v); optOut.mutate(v) }} />
          {t("leaderboard.optOut")}
        </label>
      ) : null}
    </div>
  )
}

/** Platform administrators switch the functions of a club on and off (`PATCH /clubs/{id}` with `capabilities`). */
export function CapabilityToggles({ clubId, value }: { clubId: string; value: ClubCapability[] }) {
  const t = useT("activities")
  const errorMessage = useErrorMessage()
  const patch = useCapabilities(clubId)
  return (
    <Card>
      <CardContent className="grid gap-3">
        <h3 className="font-semibold">{t("caps.title")}</h3>
        {CAPABILITIES.map((cap) => (
          <label key={cap} className="flex min-h-11 items-center justify-between gap-3">
            <span>
              <span className="block font-medium">{t(`caps.${cap}.name`)}</span>
              <span className="text-muted-foreground block text-sm">{t(`caps.${cap}.hint`)}</span>
            </span>
            <Switch
              checked={value.includes(cap)}
              disabled={patch.isPending}
              onCheckedChange={(on) => patch.mutate(on ? [...value, cap] : value.filter((c) => c !== cap))}
            />
          </label>
        ))}
        {patch.isError ? <p role="alert" className="text-destructive text-sm">{errorMessage(patch.error)}</p> : null}
      </CardContent>
    </Card>
  )
}

/** Staff view of a draft round: ranked candidates (by their profiles) to invite. */
export function DraftBoard({ clubId }: { clubId: string }) {
  const t = useT("activities")
  const errorMessage = useErrorMessage()
  const rounds = useDraftRounds(clubId)
  const members = useClubMembers(clubId)
  const { pick } = useDraftActions(clubId)
  const [roundId, setRoundId] = useState("")
  const items = rounds.data?.items ?? []
  const current = items.find((r) => r.id === roundId) ?? items[0]
  const ranking = useRanking(current?.id ?? "")
  const eventTitle = new Map((useClubEvents(clubId).data?.items ?? []).map((e) => [e.id, e.title]))
  const names = new Map((members.data?.items ?? []).map((m) => [m.user_id, m.display_name]))
  const role = Object.keys(current?.needed ?? {})[0] ?? ""
  return (
    <div className="grid gap-3">
      <NewRound clubId={clubId} />
      {!current ? <p className="text-muted-foreground text-sm">{t("noEvents")}</p> : null}
      {current ? <>
      <select className={SELECT_CLASS} value={current.id ?? ""} onChange={(e) => setRoundId(e.target.value)}>
        {items.map((r) => (
          <option key={r.id} value={r.id}>
            {eventTitle.get(r.event_id) ?? t("draftBoard.round")}
          </option>
        ))}
      </select>
      <ul className="grid gap-2">
        {(ranking.data?.items ?? []).map((r) => (
          <li key={r.user_id}>
            <Card>
              <CardContent className="flex items-center justify-between gap-3">
                <span>
                  {names.get(r.user_id) ?? r.user_id} · {r.score}
                </span>
                <Button type="button" size="sm" disabled={pick.isPending || !current.id} onClick={() => current.id && pick.mutate({ roundId: current.id, userId: r.user_id, role })}>
                  {t("draftBoard.invite")}
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      </> : null}
      {pick.isError ? <p role="alert" className="text-destructive text-sm">{errorMessage(pick.error)}</p> : null}
    </div>
  )
}

/** Opens a drafting round for one of the club's events: the role and how many people it needs. */
function NewRound({ clubId }: { clubId: string }) {
  const t = useT("activities")
  const errorMessage = useErrorMessage()
  const events = useClubEvents(clubId)
  const create = useCreateRound(clubId)
  const [eventId, setEventId] = useState("")
  const [role, setRole] = useState("")
  const [count, setCount] = useState("1")
  const n = Number(count)
  return (
    <Card>
      <CardContent className="grid gap-3">
        <h3 className="font-semibold">{t("draftBoard.newRound")}</h3>
        <select className={SELECT_CLASS} value={eventId} aria-label={t("draftBoard.round")} onChange={(e) => setEventId(e.target.value)}>
          <option value="">{t("draftBoard.round")}</option>
          {(events.data?.items ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
        <div className="grid gap-2 md:grid-cols-[1fr_8rem]">
          <input className={SELECT_CLASS} placeholder={t("draftBoard.role")} value={role} maxLength={60} onChange={(e) => setRole(e.target.value)} />
          <input type="number" min={1} className={SELECT_CLASS} aria-label={t("draftBoard.count")} value={count} onChange={(e) => setCount(e.target.value)} />
        </div>
        <Button
          type="button"
          className="w-fit"
          disabled={!eventId || !role.trim() || !Number.isInteger(n) || n < 1 || create.isPending}
          onClick={() => create.mutate({ eventId, needed: { [role.trim()]: n } }, { onSuccess: () => setRole("") })}
        >
          {t("draftBoard.create")}
        </Button>
        {create.isError ? <p role="alert" className="text-destructive text-sm">{errorMessage(create.error)}</p> : null}
      </CardContent>
    </Card>
  )
}

/** Courses of the LMS linked to the club (`canManage` adds linking, removal and confirmation). */
export function ClubCourses({ clubId, canManage }: { clubId: string; canManage: boolean }) {
  const t = useT("activities")
  const common = useT("common")
  const errorMessage = useErrorMessage()
  const { links, byId, courses, isPending } = useClubCourses(clubId)
  const { link, unlink, confirm } = useCourseLinkActions(clubId)
  const [pickId, setPickId] = useState("")
  const free = courses.filter((c) => !links.some((l) => l.course_id === c.id))
  if (isPending) return <p className="text-muted-foreground text-sm">{common("loading")}</p>
  return (
    <div className="grid gap-4">
      {links.length === 0 ? <p className="text-muted-foreground text-sm">{t("courses.empty")}</p> : null}
      <ul className="grid gap-3 md:grid-cols-2">
        {links.map((l) => {
          const course = byId.get(l.course_id)
          return (
            <li key={l.course_id}>
              <Card>
                <CardContent className="grid gap-2">
                  <p className="font-semibold">{course?.title ?? l.course_id}</p>
                  {course ? <p className="text-muted-foreground text-sm">{t("courses.lessons", { count: course.steps_count })}</p> : null}
                  <div className="flex flex-wrap items-center gap-2">
                    {l.status === "pending" ? <Badge variant="warning">{t("courses.pending")}</Badge> : null}
                    <a className="text-primary text-sm underline" href={`https://lms.ihsu.uz/courses/?slug=${course?.slug ?? ""}`}>
                      {t("courses.open")}
                    </a>
                    {canManage && l.status === "pending" ? (
                      <Button type="button" size="sm" onClick={() => confirm.mutate(l.course_id)}>
                        {t("approve")}
                      </Button>
                    ) : null}
                    {canManage ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => unlink.mutate(l.course_id)}>
                        <Icons.trash data-icon="inline-start" aria-hidden />
                        {t("courses.unlink")}
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>
      {canManage ? (
        <div className="flex gap-2">
          <select className={SELECT_CLASS} value={pickId} onChange={(e) => setPickId(e.target.value)} aria-label={t("courses.pick")}>
            <option value="">{t("courses.placeholder")}</option>
            {free.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <Button type="button" disabled={!pickId || link.isPending} onClick={() => link.mutate(pickId, { onSuccess: () => setPickId("") })}>
            {t("courses.link")}
          </Button>
        </div>
      ) : null}
      {link.isError || unlink.isError || confirm.isError ? <p role="alert" className="text-destructive text-sm">{errorMessage(link.error ?? unlink.error ?? confirm.error)}</p> : null}
    </div>
  )
}
