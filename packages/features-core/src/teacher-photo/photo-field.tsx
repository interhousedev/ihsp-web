"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { PHOTO_ACCEPT, photoProblem } from "./photo-rules"
import { TeacherAvatar } from "./teacher-avatar"

export type PhotoFieldProps = {
  /** Whose photo this is: the name is the alt text and the initials shown without a photo. */
  name: string
  /** Link to the current photo, or null when there is none. */
  photoUrl: string | null
  /** Sends the picked file; resolves once the server has saved it. Rejects with the API error. */
  onUpload: (file: File) => Promise<unknown>
  /** Removes the photo; rejects with the API error. */
  onRemove: () => Promise<unknown>
}

type Pending = "upload" | "remove" | null

/**
 * The profile photo of a teacher: the current picture, a button to upload a JPEG or PNG up to 5 MB, and a button to
 * remove it. The file is checked before it is sent. The parent saves the result (the new link) in its own state.
 */
export function PhotoField({ name, photoUrl, onUpload, onRemove }: PhotoFieldProps) {
  const t = useT("teacherPhoto")
  const errorMessage = useErrorMessage()
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [failure, setFailure] = useState<string | null>(null)

  async function run(kind: Exclude<Pending, null>, action: () => Promise<unknown>, done: string) {
    setPending(kind)
    setFailure(null)
    try {
      await action()
      toast.success(done)
    } catch (error) {
      setFailure(errorMessage(error))
    } finally {
      setPending(null)
    }
  }

  function pick(file: File | undefined) {
    if (!file) return
    const problem = photoProblem(file)
    if (problem) {
      setFailure(t(problem))
      return
    }
    void run("upload", () => onUpload(file), t("saved"))
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <TeacherAvatar name={name} photoUrl={photoUrl} size="lg" />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-muted-foreground text-xs">{t("hint")}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-8"
            disabled={pending !== null}
            onClick={() => input.current?.click()}
          >
            {pending === "upload" ? (
              <Icons.spinner aria-hidden className="animate-spin" />
            ) : (
              <Icons.upload aria-hidden />
            )}
            {photoUrl ? t("replace") : t("upload")}
          </Button>
          {photoUrl ? (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 md:min-h-8"
              disabled={pending !== null}
              onClick={() => void run("remove", onRemove, t("removed"))}
            >
              {pending === "remove" ? (
                <Icons.spinner aria-hidden className="animate-spin" />
              ) : (
                <Icons.trash aria-hidden />
              )}
              {t("remove")}
            </Button>
          ) : null}
        </div>
        <input
          ref={input}
          type="file"
          accept={PHOTO_ACCEPT}
          aria-label={t("label")}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            pick(event.target.files?.[0])
            event.target.value = ""
          }}
        />
        {pending === "upload" ? (
          <p role="status" className="text-muted-foreground text-sm">
            {t("uploading")}
          </p>
        ) : null}
        {failure ? (
          <p role="alert" className="text-destructive text-sm">
            {failure}
          </p>
        ) : null}
      </div>
    </div>
  )
}
