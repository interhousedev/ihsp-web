"use client"

import { keys, putAdminUserPhoto, type StudentItem } from "@ihsp/api"
import { PHOTO_ACCEPT, photoProblem, useCamera } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, LoadingButton, ResponsiveDialog } from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { fullName } from "../../shared/utils/names"

/**
 * The student's photo (ADM-PHOTO-1): the current one, a live camera capture with retake, or a file picked from the device.
 * The file is checked before it is sent; the server checks the content again. Closing the dialog stops the camera.
 */
export function StudentPhotoDialog({ student, onClose }: { student: StudentItem | null; onClose: () => void }) {
  const t = useT("studentPhoto")
  return (
    <ResponsiveDialog
      open={student !== null}
      onOpenChange={(open) => !open && onClose()}
      title={student ? t("title", { name: fullName(student) }) : ""}
      description={student ? t("hint") : undefined}
    >
      {student ? <PhotoBody key={student.user_id} student={student} /> : null}
    </ResponsiveDialog>
  )
}

function PhotoBody({ student }: { student: StudentItem }) {
  const t = useT("studentPhoto")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const video = useRef<HTMLVideoElement>(null)
  const files = useRef<HTMLInputElement>(null)
  const camera = useCamera()
  const [currentUrl, setCurrentUrl] = useState(student.photo_url)
  const [chosen, setChosen] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    if (!chosen) return
    const url = URL.createObjectURL(chosen)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [chosen])

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
        if (blob) accept(new File([blob], `${student.user_id}.jpg`, { type: "image/jpeg" }))
      },
      "image/jpeg",
      0.92,
    )
  }

  async function upload() {
    if (!chosen) return
    setSaving(true)
    setFailure(null)
    try {
      const saved = await putAdminUserPhoto(student.user_id, chosen)
      setCurrentUrl(saved.photo_url)
      setChosen(null)
      toast.success(t("saved"))
      void queryClient.invalidateQueries({ queryKey: keys.admin.students.all() })
    } catch (error) {
      setFailure(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const live = camera.status === "live" || camera.status === "starting"
  const showVideo = !chosen && live

  // The preview element exists only while the camera view is shown; the stream is attached once it is there.
  useEffect(() => {
    const element = video.current
    if (!element || !showVideo) return
    element.srcObject = camera.stream
    if (camera.stream) void element.play().catch(() => undefined)
  }, [camera.stream, showVideo])
  const cameraProblem =
    camera.status === "unavailable" ? t("cameraUnavailable") : camera.status === "denied" ? t("cameraDenied") : null
  const previewSrc = previewUrl !== null && /^blob:[\w:/.-]+$/.test(previewUrl) ? previewUrl : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-4">
        <figure className="flex flex-col gap-1">
          <figcaption className="text-muted-foreground text-xs">{t("current")}</figcaption>
          {currentUrl ? (
            <img
              src={currentUrl}
              alt={t("title", { name: fullName(student) })}
              className="size-28 rounded-md object-cover"
            />
          ) : (
            <span className="text-muted-foreground flex size-28 items-center justify-center rounded-md border text-sm">
              {t("noPhoto")}
            </span>
          )}
        </figure>
        {previewSrc ? (
          <figure className="flex flex-col gap-1">
            <figcaption className="text-muted-foreground text-xs">{t("preview")}</figcaption>
            <img src={previewSrc} alt={t("preview")} className="size-28 rounded-md object-cover" />
          </figure>
        ) : null}
      </div>

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
          <Button type="button" className="min-h-11 md:min-h-8" disabled={camera.status !== "live"} onClick={capture}>
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

      {failure ? (
        <p role="alert" className="text-destructive text-sm">
          {failure}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {chosen ? (
          <>
            <LoadingButton
              type="button"
              className="min-h-11 md:min-h-8"
              loading={saving}
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
              disabled={saving}
              onClick={() => {
                setChosen(null)
                setFailure(null)
              }}
            >
              {t("retake")}
            </Button>
          </>
        ) : null}
        {!chosen && camera.status !== "live" && camera.status !== "starting" && camera.status !== "unavailable" ? (
          <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => void camera.start()}>
            <Icons.upload aria-hidden />
            {t("takePhoto")}
          </Button>
        ) : null}
        {!chosen ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-8"
            onClick={() => files.current?.click()}
          >
            <Icons.upload aria-hidden />
            {t("chooseFile")}
          </Button>
        ) : null}
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
    </div>
  )
}
