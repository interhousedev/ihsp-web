"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  ConfirmDialog,
  Icons,
  PageContainer,
  Textarea,
} from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import type { PlannerStatus } from "../api/activities-api"
import {
  useAnnouncementActions,
  useAnnouncements,
  useClub,
  useMemberActions,
  usePlanner,
  usePlannerActions,
} from "../use-activities"
import { ClubProfileEditor, EventsAdmin, FormBuilder, PointsAdmin } from "./club-admin"
import { CapabilityToggles, ClubCourses, DraftBoard, Leaderboard } from "./club-capabilities"
import { PersonAvatar, SELECT_CLASS, Section, SectionTabs } from "./activity-ui"

const COLUMNS: PlannerStatus[] = ["backlog", "planned", "doing", "done"]
const AUDIENCES = ["members", "team", "event"] as const

function Planner({ clubId }: { clubId: string }) {
  const t = useT("activities")
  const errorMessage = useErrorMessage()
  const board = usePlanner(clubId)
  const { add, move } = usePlannerActions(clubId)
  const [title, setTitle] = useState("")
  const items = board.data?.items ?? []
  return (
    <div className="grid gap-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (title.trim()) add.mutate({ title: title.trim() }, { onSuccess: () => setTitle("") })
        }}
      >
        <input
          className={SELECT_CLASS}
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          aria-label={t("planner.draftTitle")}
        />
        <Button type="submit" disabled={add.isPending}>
          {t("planner.confirm")}
        </Button>
      </form>
      {add.isError || move.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(add.error ?? move.error)}
        </p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-4">
        {COLUMNS.map((col) => (
          <section key={col} className="grid content-start gap-2">
            <h3 className="text-sm font-semibold">{t(`planner.columns.${col}`)}</h3>
            {items
              .filter((i) => i.status === col)
              .map((item) => (
                <Card key={item.id}>
                  <CardContent className="grid gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <Badge variant="neutral" className="w-fit">
                      {t(`planner.kinds.${item.kind}`)}
                    </Badge>
                    <select
                      className={SELECT_CLASS}
                      value={item.status}
                      aria-label={t("planner.move")}
                      onChange={(e) => item.id && move.mutate({ id: item.id, status: e.target.value as PlannerStatus })}
                    >
                      {COLUMNS.map((c) => (
                        <option key={c} value={c}>
                          {t(`planner.columns.${c}`)}
                        </option>
                      ))}
                    </select>
                  </CardContent>
                </Card>
              ))}
          </section>
        ))}
      </div>
    </div>
  )
}

function Announcements({ clubId }: { clubId: string }) {
  const t = useT("activities")
  const errorMessage = useErrorMessage()
  const fmt = useFormatters()
  const list = useAnnouncements(clubId)
  const { send, cancel } = useAnnouncementActions(clubId)
  const [text, setText] = useState("")
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>("members")
  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="grid gap-3">
          <Textarea
            rows={3}
            maxLength={2000}
            placeholder={t("announce.placeholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <select
            className={SELECT_CLASS}
            value={audience}
            aria-label={t("announce.audience")}
            onChange={(e) => setAudience(e.target.value as typeof audience)}
          >
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {t(`announce.aud.${a}`)}
              </option>
            ))}
          </select>
          <Button
            type="button"
            className="w-fit"
            disabled={!text.trim() || send.isPending}
            onClick={() => send.mutate({ text: text.trim(), audience }, { onSuccess: () => setText("") })}
          >
            {t("announce.send")}
          </Button>
          {send.isError || cancel.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(send.error ?? cancel.error)}
            </p>
          ) : null}
        </CardContent>
      </Card>
      <Section title={t("announce.history")}>
        <ul className="grid gap-2">
          {(list.data?.items ?? []).map((a) => (
            <li key={a.id ?? a.text}>
              <Card>
                <CardContent className="grid gap-1 text-sm">
                  <p>{a.text}</p>
                  <p className="text-muted-foreground">
                    {a.sent_at ? fmt.dateTime(a.sent_at) : a.scheduled_at ? fmt.dateTime(a.scheduled_at) : ""}
                    {a.recipient_count ? ` · ${t("announce.reach", { count: a.recipient_count })}` : ""}
                  </p>
                  {a.scheduled_at && !a.sent_at && !a.cancelled && a.id ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-fit"
                      onClick={() => a.id && cancel.mutate(a.id)}
                    >
                      {t("announce.cancel")}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

type MemberRow = { user_id: string; display_name: string; role: string; status: string }
type MemberConfirm = { kind: "remove" | "decline" | "ban" | "transfer"; member: MemberRow }

/** Join requests first (approve or decline), then the members; removing and handing over ask for confirmation. */
function Members({
  clubId,
  members,
  isOwner,
  canApprove,
}: {
  clubId: string
  members: MemberRow[]
  isOwner: boolean
  canApprove: boolean
}) {
  const t = useT("activities")
  const errorMessage = useErrorMessage()
  const { approve, decline, remove, ban, transfer } = useMemberActions(clubId)
  const [confirm, setConfirm] = useState<MemberConfirm | null>(null)
  const [offered, setOffered] = useState<string | null>(null)
  const requests = members.filter((m) => m.status === "requested")
  const active = members.filter((m) => m.status === "active")
  const close = () => setConfirm(null)
  const BTN = "min-h-11 md:min-h-8"
  return (
    <div className="grid gap-6">
      {canApprove && requests.length > 0 ? (
        <Section title={t("clubActions.requestsTitle", { count: requests.length })}>
          <ul className="grid gap-2">
            {requests.map((m) => (
              <li key={m.user_id}>
                <Card>
                  <CardContent className="flex flex-wrap items-center gap-3">
                    <PersonAvatar person={{ name: m.display_name }} />
                    <p className="min-w-0 flex-1 font-medium">{m.display_name}</p>
                    <Button
                      type="button"
                      size="sm"
                      className={BTN}
                      disabled={approve.isPending}
                      onClick={() => approve.mutate(m.user_id)}
                    >
                      {t("approve")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={BTN}
                      onClick={() => setConfirm({ kind: "decline", member: m })}
                    >
                      {t("clubActions.decline")}
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <Section title={t("clubActions.membersTitle", { count: active.length })}>
        {active.length === 0 ? <p className="text-muted-foreground text-sm">{t("clubActions.noMembers")}</p> : null}
        <ul className="grid gap-2">
          {active.map((m) => (
            <li key={m.user_id}>
              <Card>
                <CardContent className="flex flex-wrap items-center gap-3">
                  <PersonAvatar person={{ name: m.display_name }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{m.display_name}</p>
                    <p className="text-muted-foreground text-sm">{t(`roles.${m.role}`)}</p>
                  </div>
                  {canApprove && m.role === "member" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={BTN}
                      onClick={() => setConfirm({ kind: "remove", member: m })}
                    >
                      {t("remove")}
                    </Button>
                  ) : null}
                  {canApprove && m.role === "member" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className={`${BTN} text-destructive`}
                      onClick={() => setConfirm({ kind: "ban", member: m })}
                    >
                      {t("clubActions.ban")}
                    </Button>
                  ) : null}
                  {isOwner && m.role !== "owner" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={BTN}
                      onClick={() => setConfirm({ kind: "transfer", member: m })}
                    >
                      {t("transfer.offer")}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
      {offered ? (
        <p role="status" className="bg-muted rounded-lg px-3 py-2 text-sm">
          {t("transfer.pendingBody", { name: offered })}
        </p>
      ) : null}
      {approve.isError || decline.isError || remove.isError || ban.isError || transfer.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(approve.error ?? decline.error ?? remove.error ?? ban.error ?? transfer.error)}
        </p>
      ) : null}
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && close()}
        title={
          confirm?.kind === "transfer"
            ? t("transfer.title")
            : t(`clubActions.${confirm?.kind ?? "remove"}Title`, { name: confirm?.member.display_name ?? "" })
        }
        description={
          confirm?.kind === "transfer"
            ? `${confirm.member.display_name}. ${t("transfer.body")}`
            : t(`clubActions.${confirm?.kind ?? "remove"}Body`)
        }
        confirmLabel={
          confirm?.kind === "transfer"
            ? t("transfer.offer")
            : confirm?.kind === "decline"
              ? t("clubActions.decline")
              : confirm?.kind === "ban"
                ? t("clubActions.ban")
                : t("remove")
        }
        destructive={confirm?.kind !== "transfer"}
        loading={decline.isPending || remove.isPending || ban.isPending || transfer.isPending}
        onConfirm={() => {
          if (!confirm) return
          const { kind, member } = confirm
          if (kind === "transfer")
            transfer.mutate(member.user_id, { onSuccess: () => setOffered(member.display_name), onSettled: close })
          else ({ decline, remove, ban })[kind].mutate(member.user_id, { onSettled: close })
        }}
      />
    </div>
  )
}

/** Club management for owners and team members; the role comes from the club's own data, not from a switcher. */
export function ManagePage() {
  const t = useT("activities")
  const common = useT("common")
  const errorMessage = useErrorMessage()
  const params = useSearchParams()
  const { club, detail, viewer, members, isPending, isError, error } = useClub(params.get("slug"), params.get("id"))
  const [tabRaw, setTab] = useState(params.get("tab") ?? "members")
  const back = (
    <Link href="/activities/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
      <Icons.chevronLeft data-icon="inline-start" aria-hidden />
      {t("back")}
    </Link>
  )
  if (isPending)
    return (
      <PageContainer title={common("loading")} back={back}>
        {null}
      </PageContainer>
    )
  if (!club)
    return (
      <PageContainer title={t("manageTitle")} back={back}>
        <p role="alert" className="text-sm">
          {isError ? errorMessage(error) : t("empty")}
        </p>
      </PageContainer>
    )
  if (!viewer.isStaff)
    return (
      <PageContainer title={club.name} back={back}>
        <p className="text-muted-foreground text-sm">{t("noAccess")}</p>
      </PageContainer>
    )

  const tabs = [
    { value: "members", label: t("manageTabs.members"), count: members.filter((m) => m.status === "requested").length },
    { value: "events", label: t("manageTabs.events") },
    { value: "announcements", label: t("manageTabs.announcements") },
    ...(club.capabilities.some((c) => c === "forms" || c === "drafting" || c === "points")
      ? [{ value: "volunteering", label: t("manageTabs.volunteering") }]
      : []),
    { value: "courses", label: t("manageTabs.courses") },
    ...(viewer.canEdit || viewer.isAdmin ? [{ value: "settings", label: t("manageTabs.settings") }] : []),
  ]
  const tab = tabs.some((x) => x.value === tabRaw) ? tabRaw : "members"
  return (
    <PageContainer title={`${t("manageTitle")} · ${club.name}`} back={back}>
      <SectionTabs tabs={tabs} value={tab} onChange={setTab}>
        <div className="mt-4">
          {tab === "members" ? (
            <Members clubId={club.id} members={members} isOwner={viewer.isOwner} canApprove={viewer.canApprove} />
          ) : null}
          {tab === "events" ? (
            <div className="grid gap-6">
              {viewer.canManageEvents ? <EventsAdmin clubId={club.id} /> : null}
              <Planner clubId={club.id} />
            </div>
          ) : null}
          {tab === "announcements" ? <Announcements clubId={club.id} /> : null}
          {tab === "volunteering" ? (
            <div className="grid gap-6">
              {club.capabilities.includes("forms") ? <FormBuilder clubId={club.id} /> : null}
              {club.capabilities.includes("drafting") ? <DraftBoard clubId={club.id} /> : null}
              {club.capabilities.includes("points") ? <PointsAdmin clubId={club.id} members={members} /> : null}
              {club.capabilities.includes("points") ? <Leaderboard clubId={club.id} /> : null}
            </div>
          ) : null}
          {tab === "courses" ? <ClubCourses clubId={club.id} canManage /> : null}
          {tab === "settings" ? (
            <div className="grid gap-6">
              {viewer.canEdit && detail ? <ClubProfileEditor clubId={club.id} club={detail} /> : null}
              {viewer.isAdmin ? <CapabilityToggles clubId={club.id} value={club.capabilities} /> : null}
            </div>
          ) : null}
        </div>
      </SectionTabs>
    </PageContainer>
  )
}
