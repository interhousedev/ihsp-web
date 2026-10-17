"use client"

import { uploadFile } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  LoadingButton,
  cn,
} from "@ihsp/ui"
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react"
import { computeCropRect, cropToBlob, imageSize } from "../utils/crop"

export type CropAspect = { key: string; ratio: number }

/** Square and 16:10 for the card image, 5:1 for the banner. */
export const CARD_ASPECTS: CropAspect[] = [
  { key: "square", ratio: 1 },
  { key: "wide", ratio: 16 / 10 },
]
export const BANNER_ASPECTS: CropAspect[] = [{ key: "banner", ratio: 5 }]

type Pending = { file: File; url: string; width: number; height: number }

/** Picks an image, lets the author crop it (aspect, zoom, position), uploads the cropped blob and returns the file id. */
export function ImageCropField({
  label,
  aspects,
  fileId,
  outWidth,
  onChange,
}: {
  label: string
  aspects: CropAspect[]
  fileId: string | null
  outWidth: number
  onChange: (fileId: string | null) => void
}) {
  const t = useT("courseSettings")
  const errorMessage = useErrorMessage()
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [aspect, setAspect] = useState(aspects[0] as CropAspect)
  const [zoom, setZoom] = useState(1)
  const [fx, setFx] = useState(0.5)
  const [fy, setFy] = useState(0.5)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => () => void (pending && URL.revokeObjectURL(pending.url)), [pending])

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      const size = await imageSize(file)
      setZoom(1)
      setFx(0.5)
      setFy(0.5)
      setAspect(aspects[0] as CropAspect)
      setPending({ file, url: URL.createObjectURL(file), ...size })
    } catch {
      setError(t("imageFailed"))
    }
  }

  async function confirm() {
    if (!pending) return
    setBusy(true)
    setError(null)
    try {
      const rect = computeCropRect(pending.width, pending.height, aspect.ratio, zoom, fx, fy)
      const blob = await cropToBlob(pending.file, rect, aspect.ratio, outWidth)
      const stored = await uploadFile(new File([blob], "course-image.jpg", { type: "image/jpeg" }), "link")
      if (stored.status === "rejected") {
        setError(t("imageFailed"))
        return
      }
      onChange(stored.id)
      setPending(null)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const rect = pending ? computeCropRect(pending.width, pending.height, aspect.ratio, zoom, fx, fy) : null
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={() => input.current?.click()} className="min-h-11 md:min-h-8">
          {fileId ? t("imageReplace") : t("imageChoose")}
        </Button>
        {fileId ? (
          <Button type="button" variant="ghost" onClick={() => onChange(null)} className="min-h-11 md:min-h-8">
            {t("imageRemove")}
          </Button>
        ) : null}
        {fileId ? <span className="text-muted-foreground text-sm">{t("imageSet")}</span> : null}
        <input
          id={id}
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => void pick(e)}
        />
      </div>
      {error && !pending ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Dialog open={pending !== null} onOpenChange={(open) => (open ? undefined : setPending(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cropTitle", { label })}</DialogTitle>
          </DialogHeader>
          {pending && rect ? (
            <div className="flex flex-col gap-4">
              {aspects.length > 1 ? (
                <div role="radiogroup" aria-label={t("cropAspect")} className="flex gap-2">
                  {aspects.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      role="radio"
                      aria-checked={aspect.key === item.key}
                      onClick={() => setAspect(item)}
                      className={cn(
                        "min-h-11 rounded-lg border px-3 text-sm md:min-h-8",
                        aspect.key === item.key && "bg-muted border-foreground font-medium",
                      )}
                    >
                      {t(`aspect.${item.key}`)}
                    </button>
                  ))}
                </div>
              ) : null}
              <div
                className="relative mx-auto w-full max-w-md overflow-hidden rounded-lg border"
                style={{ aspectRatio: String(aspect.ratio) }}
              >
                <img
                  src={pending.url}
                  alt=""
                  className="absolute max-w-none"
                  style={{
                    width: `${(pending.width / rect.w) * 100}%`,
                    left: `${(-rect.x / rect.w) * 100}%`,
                    top: `${(-rect.y / rect.h) * 100}%`,
                  }}
                />
              </div>
              <label className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0">{t("cropZoom")}</span>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="min-h-11 w-full md:min-h-6"
                />
              </label>
              <label className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0">{t("cropX")}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={fx}
                  onChange={(e) => setFx(Number(e.target.value))}
                  className="min-h-11 w-full md:min-h-6"
                />
              </label>
              <label className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0">{t("cropY")}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={fy}
                  onChange={(e) => setFy(Number(e.target.value))}
                  className="min-h-11 w-full md:min-h-6"
                />
              </label>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)} className="min-h-11 md:min-h-8">
              {t("cancel")}
            </Button>
            <LoadingButton loading={busy} onClick={() => void confirm()} className="min-h-11 md:min-h-8">
              {t("cropApply")}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Field>
  )
}
