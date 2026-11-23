"use client"

import { type CaptionTrack, uploadFile } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Checkbox, Field, FieldDescription, FieldLabel, Icons, Input } from "@ihsp/ui"
import { type ChangeEvent, useId, useRef, useState } from "react"

type Lang = CaptionTrack["lang"]

const LANGS: Lang[] = ["uz", "ru", "en"]
const VTT_ACCEPT = "text/vtt,.vtt"

/**
 * WebVTT caption tracks of a video block (WCAG 1.2.2): one optional `.vtt` per language with a label shown in the
 * player's captions menu, and at most one track turned on by default.
 */
export function CaptionTracksEditor({
  tracks,
  onChange,
}: {
  tracks: CaptionTrack[]
  onChange: (tracks: CaptionTrack[]) => void
}) {
  const t = useT("stepEditor")
  const errorMessage = useErrorMessage()
  const [busy, setBusy] = useState<Lang | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [rejected, setRejected] = useState(false)

  async function upload(lang: Lang, file: File) {
    setBusy(lang)
    setError(null)
    setRejected(false)
    try {
      const stored = await uploadFile(file, "lms_captions")
      if (stored.status === "rejected") {
        setRejected(true)
        return
      }
      const current = tracks.find((track) => track.lang === lang)
      const next: CaptionTrack = {
        lang,
        label: current?.label || t(`captions.languages.${lang}`),
        file_id: stored.id,
        default: current?.default ?? tracks.length === 0,
      }
      onChange(LANGS.flatMap((code) => (code === lang ? [next] : tracks.filter((track) => track.lang === code))))
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(null)
    }
  }

  function update(lang: Lang, patch: Partial<CaptionTrack>) {
    onChange(
      tracks.map((track) =>
        track.lang === lang ? { ...track, ...patch } : patch.default ? { ...track, default: false } : track,
      ),
    )
  }

  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-medium">{t("captions.title")}</legend>
      <p className="text-muted-foreground text-sm">{t("captions.hint")}</p>
      {LANGS.map((lang) => (
        <CaptionRow
          key={lang}
          lang={lang}
          track={tracks.find((track) => track.lang === lang) ?? null}
          busy={busy !== null}
          uploading={busy === lang}
          onPick={(file) => void upload(lang, file)}
          onChange={(patch) => update(lang, patch)}
          onRemove={() => onChange(tracks.filter((track) => track.lang !== lang))}
        />
      ))}
      {error || rejected ? (
        <Alert variant="destructive">
          <AlertDescription>{rejected ? t("captions.rejected") : errorMessage(error)}</AlertDescription>
        </Alert>
      ) : null}
    </fieldset>
  )
}

function CaptionRow({
  lang,
  track,
  busy,
  uploading,
  onPick,
  onChange,
  onRemove,
}: {
  lang: Lang
  track: CaptionTrack | null
  busy: boolean
  uploading: boolean
  onPick: (file: File) => void
  onChange: (patch: Partial<CaptionTrack>) => void
  onRemove: () => void
}) {
  const t = useT("stepEditor")
  const labelId = useId()
  const input = useRef<HTMLInputElement>(null)
  const language = t(`captions.languages.${lang}`)

  function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) onPick(file)
  }

  return (
    <div className="flex flex-col gap-2 border-t pt-3 first-of-type:border-t-0 first-of-type:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{language}</span>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="min-h-11 md:min-h-8"
          >
            <Icons.upload aria-hidden />
            {uploading ? t("captions.uploading") : track ? t("captions.replace") : t("captions.upload")}
          </Button>
          {track ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={onRemove} className="min-h-11 md:min-h-8">
              <Icons.trash aria-hidden />
              {t("captions.remove")}
            </Button>
          ) : null}
          <input
            ref={input}
            type="file"
            accept={VTT_ACCEPT}
            hidden
            tabIndex={-1}
            aria-label={t("captions.file", { language })}
            onChange={pick}
          />
        </div>
      </div>
      {track ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field className="flex-1">
            <FieldLabel htmlFor={labelId}>{t("captions.label")}</FieldLabel>
            <Input
              id={labelId}
              value={track.label}
              maxLength={60}
              onChange={(event) => onChange({ label: event.target.value })}
              className="h-11 md:h-8"
            />
          </Field>
          <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
            <Checkbox checked={track.default} onCheckedChange={(on) => onChange({ default: on === true })} />
            {t("captions.default")}
          </label>
        </div>
      ) : (
        <FieldDescription>{t("captions.none")}</FieldDescription>
      )}
    </div>
  )
}
