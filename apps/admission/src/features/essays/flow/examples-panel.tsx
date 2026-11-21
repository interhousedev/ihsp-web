"use client"

import { ApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Icons,
  Pill,
  ResponsiveDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StateView,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { consentKeys, consentQuery, putConsent } from "../../consent/api"
import { useEssays } from "../api"
import { type GalleryItem, SHARING_PURPOSE, usePublish, useGallery, useUnpublish } from "./steps-api"
import { ExemplarsTab } from "../components/exemplars-tab"
import { Section } from "./section"

function useSharingConsent() {
  const qc = useQueryClient()
  const consent = useQuery(consentQuery())
  const grant = useMutation({
    mutationFn: () => putConsent([SHARING_PURPOSE]),
    onSuccess: (data) => qc.setQueryData(consentKeys.consent(), data),
  })
  const granted = consent.data?.grants.some((g) => g.purpose === SHARING_PURPOSE && g.active) === true
  return { granted, loading: consent.isPending, grant }
}

function Excerpt({ body }: { body: string }) {
  return <p className="text-muted-foreground line-clamp-4 text-sm whitespace-pre-line">{body}</p>
}

/** One shared essay: kind, size, the prompt it answers and the targets it was written for. */
function GalleryCard({ item, onOpen, action }: { item: GalleryItem; onOpen: () => void; action?: React.ReactNode }) {
  const t = useT("essayFlow")
  const te = useT("essays")
  const kind = te(`kind.${item.kind}` as "kind.other")
  return (
    <li className="bg-card border-hairline rounded-card flex min-w-0 flex-col gap-2 border p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill tone="primary">{kind}</Pill>
        <Pill>{te("words", { count: item.word_count })}</Pill>
        {item.targets.length > 0 ? <Pill>{t("gallery.targets", { count: item.targets.length })}</Pill> : null}
      </div>
      <h4 className="line-clamp-2 text-sm font-semibold">{item.title || te("untitled")}</h4>
      {item.prompt_text ? (
        <p className="text-muted-foreground line-clamp-2 text-xs italic">{item.prompt_text}</p>
      ) : null}
      <Excerpt body={item.body} />
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={onOpen}>
          {t("gallery.read")}
        </Button>
        {action}
      </div>
    </li>
  )
}

function ReadDialog({ item, onClose }: { item: GalleryItem | null; onClose: () => void }) {
  const t = useT("essayFlow")
  const te = useT("essays")
  return (
    <ResponsiveDialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={item?.title || te("untitled")}
    >
      {item ? (
        <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto text-sm">
          <div className="flex flex-wrap gap-1.5">
            <Pill tone="primary">{te(`kind.${item.kind}` as "kind.other")}</Pill>
            <Pill>{te("words", { count: item.word_count })}</Pill>
          </div>
          {item.prompt_text ? (
            <p className="bg-muted rounded-md p-3 text-xs italic">
              <span className="font-medium not-italic">{t("gallery.prompt")}: </span>
              {item.prompt_text}
            </p>
          ) : null}
          <article className="leading-relaxed whitespace-pre-line">{item.body}</article>
        </div>
      ) : null}
    </ResponsiveDialog>
  )
}

/** Publishing needs sharing consent: the bar says where it stands and grants it in one tap. */
function ConsentBar({
  granted,
  loading,
  onGrant,
  busy,
}: {
  granted: boolean
  loading: boolean
  onGrant: () => void
  busy: boolean
}) {
  const t = useT("essayFlow")
  if (loading) return null
  if (granted)
    return (
      <p className="text-success flex items-center gap-1.5 text-xs" data-testid="sharing-on">
        <Icons.check aria-hidden className="size-3.5" />
        {t("gallery.consentOn")}
      </p>
    )
  return (
    <Alert>
      <AlertDescription className="flex flex-wrap items-center gap-2">
        {t("gallery.consentOff")}
        <Button size="sm" onClick={onGrant} disabled={busy}>
          {t("gallery.consentGrant")}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function Publisher({ mine, sharing }: { mine: GalleryItem[]; sharing: boolean }) {
  const t = useT("essayFlow")
  const te = useT("essays")
  const errorMessage = useErrorMessage()
  const essays = useEssays()
  const publish = usePublish()
  const [picked, setPicked] = useState("")
  const publishedIds = new Set(mine.map((m) => m.essay_id))
  const items = (essays.data?.items ?? []).filter((e) => e.word_count > 0)
  const optionLabel = (e: (typeof items)[number]) =>
    `${e.title || te("untitled")} · ${te("words", { count: e.word_count })}${publishedIds.has(e.id) ? ` · ${t("gallery.published")}` : ""}`
  const current = picked || items.find((e) => !publishedIds.has(e.id))?.id || ""
  const selected = items.find((e) => e.id === current)
  const copy = mine.find((m) => m.essay_id === current)
  // Publishing stamps the essay and the entry with the same instant: later edits move `updated_at` past it.
  const unchanged =
    copy !== undefined &&
    selected !== undefined &&
    copy.published_at !== null &&
    (selected.updated_at ?? "") <= copy.published_at
  const err = publish.error instanceof ApiError ? publish.error : null
  return (
    <div className="bg-card border-hairline rounded-card flex flex-col gap-2 border p-4">
      <label htmlFor="gallery-publish" className="text-sm font-medium">
        {t("gallery.publishLabel")}
      </label>
      {items.length === 0 && !essays.isPending ? (
        <p className="text-muted-foreground text-sm">{t("gallery.publishEmpty")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Select
            items={items.map((e) => ({ value: e.id, label: optionLabel(e) }))}
            value={current}
            onValueChange={(next) => next && setPicked(next)}
          >
            <SelectTrigger id="gallery-publish" className="min-w-0 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {optionLabel(e)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={!current || !sharing || publish.isPending || unchanged}
            onClick={() => publish.mutate(current)}
          >
            <Icons.share aria-hidden />
            {unchanged ? t("gallery.alreadyPublished") : copy ? t("gallery.republish") : t("gallery.publish")}
          </Button>
        </div>
      )}
      <p className="text-muted-foreground text-xs">{t("gallery.publishHint")}</p>
      {err ? (
        <p role="alert" className="text-destructive text-sm">
          {err.type === "admission/consent_required" ? t("gallery.consentOff") : errorMessage(err)}
        </p>
      ) : null}
    </div>
  )
}

/** Examples: admitted essays from the staff library (first those of the given universities), what other students shared, and the way to share your own. */
export function ExamplesPanel({ institutionIds }: { institutionIds?: string[] }) {
  const t = useT("essayFlow")
  const tl = useT("essayLedger")
  const gallery = useGallery()
  const unpublish = useUnpublish()
  const sharing = useSharingConsent()
  const [open, setOpen] = useState<GalleryItem | null>(null)
  const mine = gallery.data?.mine ?? []
  const others = gallery.data?.items ?? []

  return (
    <div className="flex flex-col gap-6" data-testid="examples-panel">
      <Section title={tl("examplesAdmitted")} hint={tl("examplesAdmittedHint")}>
        <ExemplarsTab institutionIds={institutionIds} />
      </Section>

      <Section title={t("gallery.others")} hint={t("gallery.othersHint")}>
        {gallery.isPending ? (
          <StateView state="loading" />
        ) : gallery.isError ? (
          <StateView state="error" error={gallery.error} onRetry={() => void gallery.refetch()} />
        ) : others.length === 0 ? (
          <StateView state="empty" emptyText={t("gallery.empty")} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {others.map((item) => (
              <GalleryCard key={item.essay_id} item={item} onOpen={() => setOpen(item)} />
            ))}
          </ul>
        )}
      </Section>

      <Section title={t("gallery.mine")} hint={t("gallery.mineHint")}>
        <ConsentBar
          granted={sharing.granted}
          loading={sharing.loading}
          onGrant={() => sharing.grant.mutate()}
          busy={sharing.grant.isPending}
        />
        <Publisher mine={mine} sharing={sharing.granted} />
        {mine.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {mine.map((item) => (
              <GalleryCard
                key={item.essay_id}
                item={item}
                onOpen={() => setOpen(item)}
                action={
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={unpublish.isPending}
                    onClick={() => unpublish.mutate(item.essay_id)}
                  >
                    {t("gallery.unpublish")}
                  </Button>
                }
              />
            ))}
          </ul>
        ) : null}
      </Section>

      <ReadDialog item={open} onClose={() => setOpen(null)} />
    </div>
  )
}
