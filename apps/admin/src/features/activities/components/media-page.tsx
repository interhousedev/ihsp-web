"use client"

import { useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, Input, PageContainer, ResponsiveDialog, Textarea } from "@ihsp/ui"
import { QueryState } from "@ihsp/features-core"
import { useEffect, useState } from "react"
import { UserPicker } from "../../shared/components/user-picker"
import { useAdminClubs } from "../clubs-api"
import {
  bytesToMb,
  mbToBytes,
  useAddMediaBlock,
  useDeleteMedia,
  useHideMedia,
  useMediaBlocks,
  useMediaLimits,
  useMediaQueue,
  useRemoveMediaBlock,
  useResolveReport,
  useRestoreMedia,
  useSetMediaLimits,
  type MediaState,
  type ReviewItem,
} from "../media-api"
import { ActivitiesTabs } from "./activities-tabs"

const STATES: readonly MediaState[] = ["reported", "hidden"]
const TOUCH = "min-h-11 md:min-h-8"

/** Club media moderation: the reported/hidden queue, upload blocks and per-club storage limits. */
export function MediaPage() {
  const t = useT("activities")
  const [state, setState] = useState<MediaState>("reported")
  const [clubId, setClubId] = useState("")
  const clubs = useAdminClubs().data ?? []
  const clubName = (id: string | null) => (id ? (clubs.find((c) => c.id === id)?.name ?? id) : t("media.allClubs"))
  const queue = useMediaQueue(state, clubId || undefined)
  const restore = useRestoreMedia()
  const resolve = useResolveReport()
  const [hiding, setHiding] = useState<ReviewItem | null>(null)
  const [hideReason, setHideReason] = useState("")
  const hide = useHideMedia(() => {
    setHiding(null)
    setHideReason("")
  })
  const [deleting, setDeleting] = useState<ReviewItem | null>(null)
  const remove = useDeleteMedia(() => setDeleting(null))

  const clubSelect = (value: string, onChange: (v: string) => void, label: string, allLabel: string) => (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border-input bg-background min-h-11 rounded-md border px-3 text-sm md:min-h-9"
    >
      <option value="">{allLabel}</option>
      {clubs.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )

  return (
    <PageContainer title={t("title")} meta={t("media.description")}>
      <ActivitiesTabs current="media" />

      <section className="grid gap-3" aria-labelledby="media-queue">
        <h2 id="media-queue" className="text-base font-semibold">
          {t("media.queue")}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1" role="group" aria-label={t("filters.status")}>
            {STATES.map((s) => (
              <Button
                key={s}
                type="button"
                size="sm"
                variant={state === s ? "default" : "outline"}
                className={TOUCH}
                onClick={() => setState(s)}
              >
                {t(`media.state.${s}`)}
              </Button>
            ))}
          </div>
          {clubSelect(clubId, setClubId, t("media.club"), t("media.allClubs"))}
        </div>
        <QueryState query={queue}>
          {(data) =>
            data.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("media.empty")}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((m) => (
                  <li key={m.id}>
                    <Card className="min-w-0">
                      <CardContent className="grid gap-2">
                        {m.thumbUrl ? (
                          <a href={m.originalUrl ?? m.thumbUrl} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={m.thumbUrl}
                              alt={m.caption ?? ""}
                              className="aspect-video w-full rounded-lg object-cover"
                            />
                          </a>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{t(m.kind === "video" ? "media.video" : "media.photo")}</Badge>
                          {m.status === "hidden" ? (
                            <Badge variant="destructive">{t("media.state.hidden")}</Badge>
                          ) : null}
                          <span className="text-muted-foreground min-w-0 truncate text-sm">{clubName(m.clubId)}</span>
                        </div>
                        {m.caption ? <p className="text-sm break-words">{m.caption}</p> : null}
                        {m.reports.length > 0 ? (
                          <ul className="grid gap-1">
                            {m.reports.map((r) => (
                              <li key={r.id} className="bg-muted grid gap-1 rounded-lg p-2 text-sm">
                                <span className="break-words">
                                  {r.isSubject ? `${t("media.subject")} · ` : ""}
                                  {r.reason || t("media.noReason")}
                                </span>
                                {r.status === "open" ? (
                                  <span className="flex flex-wrap gap-1">
                                    <Button
                                      type="button"
                                      size="sm"
                                      className={TOUCH}
                                      disabled={resolve.isPending}
                                      onClick={() => resolve.mutate({ id: r.id, uphold: true })}
                                    >
                                      {t("media.uphold")}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className={TOUCH}
                                      disabled={resolve.isPending}
                                      onClick={() => resolve.mutate({ id: r.id, uphold: false })}
                                    >
                                      {t("media.dismiss")}
                                    </Button>
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">{r.status}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <div className="flex flex-wrap gap-1">
                          {m.status === "hidden" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className={TOUCH}
                              disabled={restore.isPending}
                              onClick={() => restore.mutate({ id: m.id })}
                            >
                              {t("media.restore")}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className={TOUCH}
                              onClick={() => setHiding(m)}
                            >
                              {t("media.hide")}
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className={TOUCH}
                            onClick={() => setDeleting(m)}
                          >
                            {t("media.delete")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryState>
      </section>

      <BlocksSection clubSelect={clubSelect} clubName={clubName} />
      <LimitsSection clubSelect={clubSelect} />

      <ResponsiveDialog
        open={hiding !== null}
        onOpenChange={(o) => !o && setHiding(null)}
        title={t("media.hideTitle")}
        footer={
          <Button
            type="button"
            className="min-h-11 md:min-h-9"
            disabled={hide.isPending}
            onClick={() => hiding && hide.mutate({ id: hiding.id, reason: hideReason.trim() })}
          >
            {t("media.hide")}
          </Button>
        }
      >
        <Textarea
          value={hideReason}
          onChange={(e) => setHideReason(e.target.value)}
          aria-label={t("media.reason")}
          placeholder={t("media.reason")}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("media.deleteTitle")}
        footer={
          <Button
            type="button"
            variant="destructive"
            className="min-h-11 md:min-h-9"
            disabled={remove.isPending}
            onClick={() => deleting && remove.mutate({ id: deleting.id })}
          >
            {t("media.delete")}
          </Button>
        }
      >
        <p className="text-sm">{t("media.deleteBody")}</p>
      </ResponsiveDialog>
    </PageContainer>
  )
}

type ClubSelect = (value: string, onChange: (v: string) => void, label: string, allLabel: string) => React.ReactNode

function BlocksSection({ clubSelect, clubName }: { clubSelect: ClubSelect; clubName: (id: string | null) => string }) {
  const t = useT("activities")
  const blocks = useMediaBlocks()
  const unblock = useRemoveMediaBlock()
  const [userId, setUserId] = useState<string | null>(null)
  const [clubId, setClubId] = useState("")
  const [reason, setReason] = useState("")
  const add = useAddMediaBlock(() => {
    setUserId(null)
    setReason("")
  })
  return (
    <section className="grid gap-3" aria-labelledby="media-blocks">
      <h2 id="media-blocks" className="text-base font-semibold">
        {t("media.blocks")}
      </h2>
      <p className="text-muted-foreground text-sm">{t("media.blocksHint")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <UserPicker id="media-block-user" value={userId} onChange={setUserId} className="w-full sm:w-72" />
        {clubSelect(clubId, setClubId, t("media.club"), t("media.allClubs"))}
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("media.reason")}
          aria-label={t("media.reason")}
          className="min-h-11 w-full sm:w-64 md:min-h-9"
        />
        <Button
          type="button"
          className="min-h-11 md:min-h-9"
          disabled={!userId || add.isPending}
          onClick={() => userId && add.mutate({ userId, clubId: clubId || null, reason: reason.trim() })}
        >
          {t("media.block")}
        </Button>
      </div>
      <QueryState query={blocks}>
        {(items) =>
          items.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("media.noBlocks")}</p>
          ) : (
            <ul className="grid gap-2">
              {items.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-2 rounded-card border p-3 text-sm">
                  <span className="min-w-0 flex-1 break-all">
                    <span className="font-mono">{b.userId}</span> · {clubName(b.clubId)}
                    {b.reason ? ` · ${b.reason}` : ""}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={TOUCH}
                    disabled={unblock.isPending}
                    onClick={() => unblock.mutate({ userId: b.userId, clubId: b.clubId })}
                  >
                    {t("media.unblock")}
                  </Button>
                </li>
              ))}
            </ul>
          )
        }
      </QueryState>
    </section>
  )
}

function LimitsSection({ clubSelect }: { clubSelect: ClubSelect }) {
  const t = useT("activities")
  const [clubId, setClubId] = useState("")
  const limits = useMediaLimits(clubId || null)
  const save = useSetMediaLimits(clubId)
  const [photo, setPhoto] = useState("")
  const [video, setVideo] = useState("")
  const [quota, setQuota] = useState("")
  const data = limits.data
  useEffect(() => {
    const mb = (n: number | null | undefined) => (n == null ? "" : String(bytesToMb(n)))
    setPhoto(mb(data?.overridePhotoMaxBytes))
    setVideo(mb(data?.overrideVideoMaxBytes))
    setQuota(mb(data?.overrideQuotaBytes))
  }, [data])
  const parsed = [mbToBytes(photo), mbToBytes(video), mbToBytes(quota)] as const
  const invalid = parsed.some((v) => v === "invalid")
  const fields = [
    { key: "photo", value: photo, set: setPhoto, effective: data?.photoMaxBytes },
    { key: "video", value: video, set: setVideo, effective: data?.videoMaxBytes },
    { key: "quota", value: quota, set: setQuota, effective: data?.quotaBytes },
  ] as const
  return (
    <section className="grid gap-3" aria-labelledby="media-limits">
      <h2 id="media-limits" className="text-base font-semibold">
        {t("media.limits")}
      </h2>
      {clubSelect(clubId, setClubId, t("media.club"), t("media.pickClub"))}
      {clubId ? (
        <QueryState query={limits}>
          {(l) => (
            <Card>
              <CardContent className="grid gap-3">
                <p className="text-sm">
                  {t("media.usage", { used: bytesToMb(l.usedBytes), quota: bytesToMb(l.quotaBytes), n: l.itemCount })}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {fields.map((f) => (
                    <label key={f.key} className="grid gap-1 text-sm">
                      <span className="font-medium">{t(`media.field.${f.key}`)}</span>
                      <Input
                        inputMode="decimal"
                        value={f.value}
                        onChange={(e) => f.set(e.target.value)}
                        placeholder={t("media.defaultMb", { n: bytesToMb(f.effective ?? 0) })}
                        aria-invalid={mbToBytes(f.value) === "invalid"}
                        className="min-h-11 md:min-h-9"
                      />
                    </label>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">{t("media.limitsHint")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="min-h-11 md:min-h-9"
                    disabled={invalid || save.isPending}
                    onClick={() => {
                      const [p, v, q] = parsed
                      if (p === "invalid" || v === "invalid" || q === "invalid") return
                      save.mutate({ photoMaxBytes: p, videoMaxBytes: v, quotaBytes: q })
                    }}
                  >
                    {t("media.save")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 md:min-h-9"
                    disabled={save.isPending}
                    onClick={() => save.mutate(null)}
                  >
                    {t("media.reset")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </QueryState>
      ) : null}
    </section>
  )
}
