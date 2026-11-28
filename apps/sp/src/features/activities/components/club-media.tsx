"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Checkbox, Icons, ResponsiveDialog, Textarea } from "@ihsp/ui"
import { useEffect, useRef, useState, type ReactNode } from "react"
import type { ClubMedia } from "../api/activities-api"
import { MEDIA_ACCEPT, mediaUrl, useMedia } from "../use-club-media"

/** Event cover: the signed thumbnail of `cover_media_id`, or nothing. */
export function EventCover({ mediaId, className }: { mediaId: string | null | undefined; className?: string }) {
  const media = useMedia(mediaId)
  const src = mediaUrl(media.data?.preview_url ?? media.data?.thumb_url ?? media.data?.poster_url)
  if (!src) return null
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className={className ?? "aspect-video w-full rounded-md object-cover"}
    />
  )
}

/** Square tiles of photos and videos; a tile opens the lightbox. */
export function MediaGrid({ items, onOpen }: { items: ClubMedia[]; onOpen: (index: number) => void }) {
  const t = useT("clubMedia")
  return (
    <ul className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-6">
      {items.map((m, i) => {
        const src = mediaUrl(m.thumb_url ?? m.poster_url)
        return (
          <li key={m.id} className="bg-muted relative aspect-square overflow-hidden rounded-sm">
            <button
              type="button"
              className="focus-visible:ring-ring size-full focus-visible:ring-2 focus-visible:outline-none"
              aria-label={m.kind === "video" ? t("openVideo") : t("openPhoto")}
              onClick={() => onOpen(i)}
              disabled={m.status !== "ready"}
            >
              {src ? (
                <img
                  src={src}
                  alt={m.caption ?? ""}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-muted-foreground grid size-full place-items-center p-1 text-center text-xs">
                  {m.status === "failed" ? t("failed") : t("processing")}
                </span>
              )}
              {m.kind === "video" ? (
                <Icons.play className="absolute right-1 bottom-1 size-5 text-white drop-shadow" aria-hidden />
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/** Full-size view with previous/next (arrow keys and swipe), plus the per-item actions. */
export function MediaLightbox({
  items,
  index,
  onIndex,
  onClose,
  actions,
}: {
  items: ClubMedia[]
  index: number | null
  onIndex: (index: number) => void
  onClose: () => void
  /** Buttons for the item on screen (cover, delete, report). */
  actions: ReactNode
}) {
  const t = useT("clubMedia")
  const touchX = useRef<number | null>(null)
  const media = index == null ? null : items[index]
  const count = items.length
  useEffect(() => {
    if (index == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % count)
      if (e.key === "ArrowLeft") onIndex((index - 1 + count) % count)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [index, count, onIndex])
  if (!media || index == null) return null
  const video = mediaUrl(media.video_url)
  const image = mediaUrl(media.preview_url ?? media.original_url ?? media.thumb_url)
  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => (open ? null : onClose())}
      title={t("position", { current: index + 1, total: count })}
      description={media.caption ?? undefined}
      size="lg"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("previous")}
              disabled={count < 2}
              onClick={() => onIndex((index - 1 + count) % count)}
            >
              <Icons.chevronLeft aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("next")}
              disabled={count < 2}
              onClick={() => onIndex((index + 1) % count)}
            >
              <Icons.chevronRight aria-hidden />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
      }
    >
      <div
        className="grid place-items-center"
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null
        }}
        onTouchEnd={(e) => {
          const start = touchX.current
          const end = e.changedTouches[0]?.clientX
          touchX.current = null
          if (start == null || end == null || Math.abs(end - start) < 40 || count < 2) return
          onIndex(end < start ? (index + 1) % count : (index - 1 + count) % count)
        }}
      >
        {media.kind === "video" && video ? (
          <video
            key={media.id}
            src={video}
            poster={mediaUrl(media.poster_url) ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="max-h-[70vh] w-full rounded-md bg-black"
          >
            <track kind="captions" />
          </video>
        ) : image ? (
          <img key={media.id} src={image} alt={media.caption ?? ""} className="max-h-[70vh] w-auto rounded-md" />
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}

/** "Report" form: reason and "this is me" (subject asks for removal). */
export function ReportMediaDialog({
  open,
  onOpenChange,
  pending,
  error,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  error: unknown
  onSubmit: (reason: string, isSubject: boolean) => void
}) {
  const t = useT("clubMedia")
  const errorMessage = useErrorMessage()
  const [reason, setReason] = useState("")
  const [isSubject, setIsSubject] = useState(false)
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("report.title")}
      description={t("report.description")}
      onSubmit={(e) => {
        e.preventDefault()
        if (reason.trim() && !pending) onSubmit(reason.trim(), isSubject)
      }}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={!reason.trim() || pending}>
            {t("report.submit")}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Textarea
          rows={3}
          maxLength={500}
          value={reason}
          aria-label={t("report.reason")}
          placeholder={t("report.reason")}
          onChange={(e) => setReason(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={isSubject} onCheckedChange={(v) => setIsSubject(v === true)} />
          {t("report.isSubject")}
        </label>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(error)}
          </p>
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}

/** File picker with the consent attestation the backend requires for every upload. */
export function MediaUploadButton({
  pending,
  onFiles,
  accept = MEDIA_ACCEPT,
  max,
  label,
}: {
  pending: boolean
  onFiles: (files: File[], consentAttested: boolean) => void
  accept?: string
  max?: number
  label?: string
}) {
  const t = useT("clubMedia")
  const input = useRef<HTMLInputElement>(null)
  const [consent, setConsent] = useState(false)
  return (
    <div className="grid gap-2">
      <label className="flex items-start gap-2 text-sm">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
        <span>{t("upload.consent")}</span>
      </label>
      <input
        ref={input}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])].slice(0, max)
          e.target.value = ""
          if (files.length > 0) onFiles(files, consent)
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        disabled={!consent || pending}
        onClick={() => input.current?.click()}
      >
        <Icons.upload data-icon="inline-start" aria-hidden />
        {pending ? t("upload.uploading") : (label ?? t("upload.button"))}
      </Button>
    </div>
  )
}
