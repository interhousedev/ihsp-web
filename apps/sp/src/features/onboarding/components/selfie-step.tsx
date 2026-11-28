"use client"

import { keys, putMyFace } from "@ihsp/api"
import { HidePhotoSwitch, refreshSessionUser, useCamera } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { cropRect, encodeJpeg, fileToJpeg, SELFIE_ASPECT } from "../utils/encode-jpeg"

const PHOTO_TYPES = ["image/jpeg", "image/png"]
const PHOTO_MAX_BYTES = 5 * 1024 * 1024

/**
 * The required photo step: the front camera with a face-oval guide, capture, retake and confirm; a file input with the
 * camera hint when the camera is unavailable or refused. Saving refreshes the onboarding state, which moves on.
 */
export function SelfieStep() {
  const t = useT("onboarding")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const camera = useCamera()
  const video = useRef<HTMLVideoElement>(null)
  const files = useRef<HTMLInputElement>(null)
  const confirmButton = useRef<HTMLButtonElement>(null)
  const [chosen, setChosen] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const live = camera.status === "live" || camera.status === "starting"
  const showVideo = !chosen && live

  useEffect(() => {
    if (!chosen) return
    const url = URL.createObjectURL(chosen)
    setPreviewUrl(url)
    confirmButton.current?.focus()
    return () => URL.revokeObjectURL(url)
  }, [chosen])

  useEffect(() => {
    const element = video.current
    if (!element || !showVideo) return
    element.srcObject = camera.stream
    if (camera.stream) void element.play().catch(() => undefined)
  }, [camera.stream, showVideo])

  function accept(file: File) {
    if (!PHOTO_TYPES.includes(file.type)) return setFailure(t("selfie.wrongType"))
    if (file.size > PHOTO_MAX_BYTES) return setFailure(t("selfie.tooLarge"))
    setFailure(null)
    setChosen(file)
    camera.stop()
  }

  async function capture() {
    const frame = video.current
    if (!frame || frame.videoWidth === 0) return
    const file = await encodeJpeg(frame, cropRect(frame.videoWidth, frame.videoHeight))
    if (file) accept(file)
    else setFailure(t("selfie.captureFailed"))
  }

  async function pick(file: File | undefined) {
    if (!file) return
    // Re-encoded when the browser can decode it (downscaled JPEG); otherwise the original goes to the server's checks.
    accept((await fileToJpeg(file)) ?? file)
  }

  async function confirm() {
    if (!chosen) return
    setSaving(true)
    setFailure(null)
    try {
      await putMyFace(chosen)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.me.face() }),
        queryClient.invalidateQueries({ queryKey: keys.me.onboarding() }),
        refreshSessionUser(queryClient),
      ])
    } catch (error) {
      setFailure(errorMessage(error))
      setSaving(false)
    }
  }

  const cameraProblem =
    camera.status === "denied"
      ? t("selfie.cameraDenied")
      : camera.status === "unavailable"
        ? t("selfie.cameraUnavailable")
        : null
  const previewSrc = previewUrl !== null && /^blob:[\w:/.-]+$/.test(previewUrl) ? previewUrl : null

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">{t("selfie.intro")}</p>
      <p className="text-muted-foreground text-xs">{t("selfie.privacy")}</p>

      <div
        className="bg-muted relative mx-auto w-full max-w-xs overflow-hidden rounded-2xl"
        style={{ aspectRatio: SELFIE_ASPECT }}
      >
        {chosen && previewSrc ? (
          <img src={previewSrc} alt={t("selfie.previewAlt")} className="size-full object-cover" />
        ) : showVideo ? (
          <>
            <video
              ref={video}
              playsInline
              muted
              aria-label={t("selfie.liveLabel")}
              className="size-full -scale-x-100 object-cover"
            />
            <div
              aria-hidden
              data-testid="face-guide"
              className="border-background/90 pointer-events-none absolute inset-x-[14%] top-[10%] bottom-[16%] rounded-[50%] border-2 border-dashed shadow-[0_0_0_999px_rgb(0_0_0/0.35)]"
            />
            <p className="absolute inset-x-0 bottom-2 px-2 text-center text-xs text-white">{t("selfie.guide")}</p>
          </>
        ) : (
          <p className="text-muted-foreground flex size-full items-center justify-center p-4 text-center text-sm">
            {camera.status === "starting" ? t("selfie.cameraStarting") : cameraProblem ? null : t("selfie.cameraHint")}
          </p>
        )}
      </div>

      {cameraProblem ? (
        <p role="status" className="text-sm">
          {cameraProblem}
        </p>
      ) : null}
      {failure ? (
        <p role="alert" className="text-destructive text-sm">
          {failure}
        </p>
      ) : null}

      <HidePhotoSwitch />

      <div className="flex flex-col gap-2">
        {chosen ? (
          <>
            <Button
              ref={confirmButton}
              type="button"
              className="min-h-11"
              disabled={saving}
              onClick={() => void confirm()}
            >
              {saving ? t("selfie.saving") : t("selfie.confirm")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={saving}
              onClick={() => {
                setChosen(null)
                setPreviewUrl(null)
                setFailure(null)
                void camera.start()
              }}
            >
              {t("selfie.retake")}
            </Button>
          </>
        ) : showVideo ? (
          <Button type="button" className="min-h-11" disabled={camera.status !== "live"} onClick={() => void capture()}>
            {t("selfie.capture")}
          </Button>
        ) : (
          <Button type="button" className="min-h-11" onClick={() => void camera.start()}>
            {t("selfie.openCamera")}
          </Button>
        )}
        {chosen ? null : (
          <>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => files.current?.click()}>
              {t("selfie.chooseFile")}
            </Button>
            <input
              ref={files}
              type="file"
              accept="image/*"
              capture="user"
              className="sr-only"
              aria-label={t("selfie.chooseFile")}
              tabIndex={-1}
              onChange={(event) => {
                void pick(event.target.files?.[0])
                event.target.value = ""
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
