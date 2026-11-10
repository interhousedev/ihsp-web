"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons, LoadingButton } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { PHOTO_ACCEPT, photoProblem } from "../teacher-photo/photo-rules"
import { useCamera } from "./use-camera"

export type FacePhotoEditorProps = {
  /** Whose face this is: the alt text of the photo. */
  name: string
  /** Link to the face on file, or null when there is none or it is not known. */
  photoUrl: string | null
  /** Whether the face can be removed (it is on file, or the state is unknown to the caller). */
  removable: boolean
  /** Shows the photo only: no upload, camera or remove. */
  readOnly?: boolean
  /** Sends the picked or captured file; resolves once the server has saved it. Rejects with the API error. */
  onUpload: (file: File) => Promise<unknown>
  /** Removes the face; rejects with the API error. */
  onRemove: () => Promise<unknown>
}

/**
 * The photo the entrance device recognises: the current one, a live camera capture with retake, or a file from the
 * device. The file is checked before it is sent; the server checks the face again (no face, several faces).
 * Closing or leaving the view stops the camera.
 */
export function FacePhotoEditor({
  name,
  photoUrl,
  removable,
  readOnly = false,
  onUpload,
  onRemove,
}: FacePhotoEditorProps) {
  const t = useT("facePhoto")
  const tCommon = useT("common")
  const errorMessage = useErrorMessage()
  const video = useRef<HTMLVideoElement>(null)
  const files = useRef<HTMLInputElement>(null)
  const camera = useCamera()
  const [chosen, setChosen] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pending, setPending] = useState<"upload" | "remove" | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  useEffect(() => {
    if (!chosen) return
    const url = URL.createObjectURL(chosen)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [chosen])

  const live = camera.status === "live" || camera.status === "starting"
  const showVideo = !chosen && live

  // The preview element exists only while the camera view is shown; the stream is attached once it is there.
  useEffect(() => {
    const element = video.current
    if (!element || !showVideo) return
    element.srcObject = camera.stream
    if (camera.stream) void element.play().catch(() => undefined)
  }, [camera.stream, showVideo])

  function accept(file: File) {
    const problem = photoProblem(file)
    if (problem) {
      setFailure(t(problem))
      return
    }
    setFailure(null)
    setChosen(file)
    camera.stop()
  }

  function capture() {
    const frame = video.current
    if (!frame || frame.videoWidth === 0) return
    const canvas = document.createElement("canvas")
    canvas.width = frame.videoWidth
    canvas.height = frame.videoHeight
    canvas.getContext("2d")?.drawImage(frame, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (blob) accept(new File([blob], "face.jpg", { type: "image/jpeg" }))
      },
      "image/jpeg",
      0.92,
    )
  }

  async function upload() {
    if (!chosen) return
    setPending("upload")
    setFailure(null)
    try {
      await onUpload(chosen)
      setChosen(null)
      toast.success(t("saved"))
    } catch (error) {
      setFailure(errorMessage(error))
    } finally {
      setPending(null)
    }
  }

  async function remove() {
    setPending("remove")
    setFailure(null)
    try {
      await onRemove()
      toast.success(t("removed"))
    } catch (error) {
      setFailure(errorMessage(error))
    } finally {
      setPending(null)
      setConfirmingRemove(false)
    }
  }

  const cameraProblem =
    camera.status === "unavailable" ? t("cameraUnavailable") : camera.status === "denied" ? t("cameraDenied") : null
  const busy = pending !== null
  const previewSrc = previewUrl !== null && /^blob:[\w:/.-]+$/.test(previewUrl) ? previewUrl : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-4">
        <figure className="flex flex-col gap-1">
          <figcaption className="text-muted-foreground text-xs">{t("current")}</figcaption>
          {photoUrl ? (
            <img src={photoUrl} alt={t("alt", { name })} className="size-28 rounded-md object-cover" />
          ) : (
            <span className="text-muted-foreground flex size-28 items-center justify-center rounded-md border text-center text-sm">
              {t("noPhoto")}
            </span>
          )}
        </figure>
        {previewSrc && chosen ? (
          <figure className="flex flex-col gap-1">
            <figcaption className="text-muted-foreground text-xs">{t("preview")}</figcaption>
            <img src={previewSrc} alt={t("preview")} className="size-28 rounded-md object-cover" />
          </figure>
        ) : null}
      </div>

      {readOnly ? null : (
        <>
          {showVideo ? (
            <div className="flex flex-col gap-2">
              <video
                ref={video}
                autoPlay
                muted
                playsInline
                aria-label={t("video")}
                className="bg-muted aspect-video w-full rounded-md object-cover"
              />
              <p className="text-muted-foreground text-sm">{t("cameraHint")}</p>
              <Button
                type="button"
                className="min-h-11 md:min-h-8"
                disabled={camera.status !== "live"}
                onClick={capture}
              >
                <Icons.upload aria-hidden />
                {t("capture")}
              </Button>
            </div>
          ) : null}

          {cameraProblem ? (
            <p role="status" className="text-muted-foreground text-sm">
              {cameraProblem}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {chosen ? (
              <>
                <LoadingButton
                  type="button"
                  className="min-h-11 md:min-h-8"
                  loading={pending === "upload"}
                  loadingLabel={t("uploading")}
                  onClick={() => void upload()}
                >
                  <Icons.upload aria-hidden />
                  {t("upload")}
                </LoadingButton>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 md:min-h-8"
                  disabled={busy}
                  onClick={() => {
                    setChosen(null)
                    setFailure(null)
                  }}
                >
                  {t("retake")}
                </Button>
              </>
            ) : (
              <>
                {!live && camera.status !== "unavailable" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 md:min-h-8"
                    disabled={busy}
                    onClick={() => void camera.start()}
                  >
                    <Icons.upload aria-hidden />
                    {t("takePhoto")}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 md:min-h-8"
                  disabled={busy}
                  onClick={() => files.current?.click()}
                >
                  <Icons.upload aria-hidden />
                  {t("chooseFile")}
                </Button>
                {removable ? (
                  <LoadingButton
                    type="button"
                    variant="ghost"
                    className="min-h-11 md:min-h-8"
                    disabled={busy}
                    loading={pending === "remove"}
                    loadingLabel={tCommon("loading")}
                    onClick={() => setConfirmingRemove(true)}
                  >
                    <Icons.trash aria-hidden />
                    {t("remove")}
                  </LoadingButton>
                ) : null}
              </>
            )}
            <input
              ref={files}
              type="file"
              accept={PHOTO_ACCEPT}
              // Phones open the front camera directly; desktops ignore the attribute and show the file picker.
              capture="user"
              aria-label={t("chooseFile")}
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (file) accept(file)
              }}
            />
          </div>
        </>
      )}

      {failure ? (
        <p role="alert" className="text-destructive text-sm">
          {failure}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmingRemove}
        onOpenChange={setConfirmingRemove}
        title={t("removeTitle")}
        description={t("removeDescription")}
        confirmLabel={t("remove")}
        destructive
        loading={pending === "remove"}
        onConfirm={remove}
      />
    </div>
  )
}
