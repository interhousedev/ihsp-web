"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icons,
  Input,
  PageContainer,
  ResponsiveDialog,
  Textarea,
} from "@ihsp/ui"
import { QueryState } from "@ihsp/features-core"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { UserPicker } from "../../shared/components/user-picker"
import {
  CLUB_CAPABILITIES,
  useAdminClubs,
  useClubCapabilities,
  useForceTransferClub,
  useResumeClub,
  useReviewClub,
  useSetCapabilities,
  useSuspendClub,
  type AdminClub,
  type ClubCapability,
  type ClubStatus,
} from "../clubs-api"
import { ActivitiesTabs } from "./activities-tabs"
import { CreateClubDialog } from "./create-club-dialog"

const VARIANT = {
  draft: "outline",
  pending_review: "warning",
  active: "success",
  suspended: "destructive",
  archived: "secondary",
} as const satisfies Record<ClubStatus, string>
type Chip = "all" | "active" | "suspended" | "archived"
const CHIPS: readonly Chip[] = ["all", "active", "suspended", "archived"]

/** The club picture, or its initials when none is uploaded. */
function ClubLogo({ club }: { club: Pick<AdminClub, "name" | "logoUrl"> }) {
  if (club.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={club.logoUrl} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
  }
  const words = club.name.trim().split(/\s+/)
  const letters = words.length > 1 ? `${words[0]![0]}${words[1]![0]}` : club.name.trim().slice(0, 2)
  return (
    <span
      className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-lg text-sm font-semibold"
      aria-hidden
    >
      {letters.toUpperCase() || "?"}
    </span>
  )
}

/** Club management: applications first, then the clubs; approve, send back, suspend and hand over. */
export function ClubsPage() {
  const t = useT("activities")
  const [chip, setChip] = useState<Chip>("all")
  const clubsQuery = useAdminClubs(chip === "all" ? undefined : chip)
  const pendingQuery = useAdminClubs("pending_review")
  const [open, setOpen] = useState<AdminClub | null>(null)
  const [changesMode, setChangesMode] = useState(false)
  const [changesText, setChangesText] = useState("")
  const [suspend, setSuspend] = useState<AdminClub | null>(null)
  const [reason, setReason] = useState("")
  const [transfer, setTransfer] = useState<AdminClub | null>(null)
  const [heir, setHeir] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [caps, setCaps] = useState<AdminClub | null>(null)
  const [picked, setPicked] = useState<ClubCapability[] | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const closeReview = () => {
    setOpen(null)
    setChangesMode(false)
    setChangesText("")
  }
  const approve = useReviewClub(closeReview)
  const sendBack = useReviewClub(() => {
    if (open) setSent(open.name)
    closeReview()
  })
  const suspendClub = useSuspendClub(() => setSuspend(null))
  const transferClub = useForceTransferClub(() => setTransfer(null))
  const resumeClub = useResumeClub()
  const closeCaps = () => {
    setCaps(null)
    setPicked(null)
  }
  const capsQuery = useClubCapabilities(caps?.id ?? null)
  const loadError = useErrorMessage()
  useEffect(() => {
    if (capsQuery.isError) toast.error(loadError(capsQuery.error))
  }, [capsQuery.isError, capsQuery.error, loadError])
  const setCapabilities = useSetCapabilities(closeCaps)
  const current = picked ?? capsQuery.data ?? []
  const toggleCap = (c: ClubCapability) =>
    setPicked(current.includes(c) ? current.filter((x) => x !== c) : [...current, c])

  const pending = pendingQuery.data ?? []
  const rest = (clubsQuery.data ?? [])
    .filter((c) => c.status !== "pending_review" && c.status !== "draft")
    .filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()))
  const MENU = "min-h-11 md:min-h-8"

  return (
    <PageContainer
      title={t("title")}
      meta={t("clubs.description")}
      actions={
        <Button type="button" className="min-h-11 md:min-h-9" onClick={() => setCreating(true)}>
          {t("clubs.create")}
        </Button>
      }
    >
      <ActivitiesTabs current="clubs" />
      {sent ? (
        <p role="status" className="bg-muted rounded-lg px-3 py-2 text-sm">
          {t("clubs.changesSent", { name: sent })}
        </p>
      ) : null}
      {pending.length > 0 ? (
        <section className="grid gap-2" aria-label={t("clubs.applications", { n: pending.length })}>
          <h2 className="text-base font-semibold">{t("clubs.applications", { n: pending.length })}</h2>
          <ul className="grid gap-2">
            {pending.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setOpen(c)}
                  className="bg-warning-muted focus-visible:ring-ring/50 flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-card border p-3 text-left focus-visible:ring-[3px] focus-visible:outline-none"
                >
                  <ClubLogo club={c} />
                  <span className="block min-w-0 flex-1 truncate font-medium">{c.name}</span>
                  <Icons.chevronRight className="size-4 shrink-0" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("clubs.search")}
          aria-label={t("clubs.search")}
          className="min-h-11 w-full sm:w-64 md:min-h-9"
        />
        <div className="flex flex-wrap gap-1" role="group" aria-label={t("filters.status")}>
          {CHIPS.map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={chip === c ? "default" : "outline"}
              className="min-h-11 md:min-h-8"
              onClick={() => setChip(c)}
            >
              {c === "all" ? t("clubs.chipAll") : t(`clubs.status.${c}`)}
            </Button>
          ))}
        </div>
      </div>

      <QueryState query={clubsQuery}>
        {() => (
          <ul className="grid gap-3">
            {rest.map((c) => (
              <li key={c.id}>
                <Card className="min-w-0">
                  <CardContent className="grid gap-2">
                    <div className="flex items-start gap-2">
                      <ClubLogo club={c} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{c.name}</p>
                          <Badge variant={VARIANT[c.status]}>{t(`clubs.status.${c.status}`)}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {c.ownerName ? t("clubs.owner", { name: c.ownerName }) : t("clubs.noOwner")} ·{" "}
                          {t("clubs.members", { n: c.memberCount })}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-11 md:size-9"
                              aria-label={t("clubs.menu")}
                            >
                              <Icons.moreHorizontal aria-hidden />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="min-w-48">
                          <DropdownMenuItem
                            className={MENU}
                            onClick={() => {
                              setPicked(null)
                              setCaps(c)
                            }}
                          >
                            {t("clubs.capabilities")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={MENU}
                            onClick={() => {
                              setHeir(null)
                              setTransfer(c)
                            }}
                          >
                            {t("clubs.transfer")}
                          </DropdownMenuItem>
                          {c.status === "suspended" ? (
                            <DropdownMenuItem
                              className={MENU}
                              disabled={resumeClub.isPending}
                              onClick={() => resumeClub.mutate({ id: c.id })}
                            >
                              {t("clubs.resume")}
                            </DropdownMenuItem>
                          ) : c.status !== "active" ? null : (
                            <DropdownMenuItem
                              className={MENU}
                              onClick={() => {
                                setReason("")
                                setSuspend(c)
                              }}
                            >
                              {t("clubs.suspend")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
            {rest.length === 0 ? (
              <li className="text-muted-foreground py-6 text-center text-sm">{t("empty")}</li>
            ) : null}
          </ul>
        )}
      </QueryState>

      <CreateClubDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(name) => {
          setSent(null)
          toast.success(t("clubs.created", { name }))
        }}
      />

      <ResponsiveDialog
        open={open !== null}
        onOpenChange={(o) => !o && closeReview()}
        title={open?.name ?? ""}
        footer={
          changesMode ? (
            <>
              <Button type="button" variant="outline" onClick={() => setChangesMode(false)}>
                {t("form.back")}
              </Button>
              <Button
                type="button"
                disabled={changesText.trim() === "" || sendBack.isPending}
                onClick={() => open && sendBack.mutate({ id: open.id, approve: false, reason: changesText.trim() })}
              >
                {t("clubs.changesSend")}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setChangesMode(true)}>
                {t("clubs.changes")}
              </Button>
              <Button
                type="button"
                disabled={approve.isPending}
                onClick={() => open && approve.mutate({ id: open.id, approve: true })}
              >
                {t("clubs.approve")}
              </Button>
            </>
          )
        }
      >
        <div className="grid gap-3 text-sm">
          {open?.ownerName ? <p>{t("clubs.owner", { name: open.ownerName })}</p> : null}
          {changesMode ? (
            <div className="grid gap-1.5">
              <label htmlFor="changes" className="font-medium">
                {t("clubs.changesLabel")}
              </label>
              <Textarea id="changes" rows={4} value={changesText} onChange={(e) => setChangesText(e.target.value)} />
            </div>
          ) : null}
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={caps !== null}
        onOpenChange={(o) => !o && closeCaps()}
        title={t("clubs.capabilitiesTitle", { name: caps?.name ?? "" })}
        description={t("clubs.capabilitiesBody")}
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeCaps}>
              {t("form.back")}
            </Button>
            <Button
              type="button"
              disabled={!capsQuery.isSuccess || setCapabilities.isPending}
              onClick={() => caps && setCapabilities.mutate({ id: caps.id, capabilities: current })}
            >
              {t("clubs.capabilitiesSave")}
            </Button>
          </>
        }
      >
        <ul className="grid gap-2">
          {CLUB_CAPABILITIES.map((c) => (
            <li key={c}>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm md:min-h-9">
                <Checkbox
                  checked={current.includes(c)}
                  disabled={!capsQuery.isSuccess}
                  onCheckedChange={() => toggleCap(c)}
                  className="mt-0.5"
                />
                <span className="grid">
                  <span className="font-medium">{t(`clubs.capability.${c}`)}</span>
                  <span className="text-muted-foreground">{t(`clubs.capabilityHint.${c}`)}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={suspend !== null}
        onOpenChange={(o) => !o && setSuspend(null)}
        title={t("clubs.suspendTitle", { name: suspend?.name ?? "" })}
        description={t("clubs.suspendBody")}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSuspend(null)}>
              {t("form.back")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={reason.trim() === "" || suspendClub.isPending}
              onClick={() => suspend && suspendClub.mutate({ id: suspend.id, reason: reason.trim() })}
            >
              {t("clubs.suspend")}
            </Button>
          </>
        }
      >
        <div className="grid gap-1.5">
          <label htmlFor="s-reason" className="text-sm font-medium">
            {t("clubs.suspendReason")} <span className="text-destructive">*</span>
          </label>
          <Textarea id="s-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={transfer !== null}
        onOpenChange={(o) => !o && setTransfer(null)}
        title={t("clubs.transferTitle", { name: transfer?.name ?? "" })}
        description={t("clubs.newOwner")}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setTransfer(null)}>
              {t("form.back")}
            </Button>
            <Button
              type="button"
              disabled={!heir || transferClub.isPending}
              onClick={() => transfer && heir && transferClub.mutate({ id: transfer.id, toUserId: heir })}
            >
              {t("clubs.transfer")}
            </Button>
          </>
        }
      >
        <UserPicker id="club-heir" value={heir} onChange={setHeir} />
      </ResponsiveDialog>
    </PageContainer>
  )
}
