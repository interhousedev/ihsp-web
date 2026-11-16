"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, StateView } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { consentQuery } from "../../consent/api"
import { questionSpeech, transcribe } from "../api"

export function VoiceAnswer({
  questionId,
  disabled,
  onText,
}: {
  questionId: string
  disabled: boolean
  onText: (text: string) => void
}) {
  const t = useT("career")
  const consent = useQuery(consentQuery())
  const granted = consent.data?.grants.some((g) => g.purpose === "admission_ai" && g.active) === true
  const locked = disabled || !granted
  const locale = useLocale()
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const active = useRef(true)
  const playback = useRef<HTMLAudioElement | null>(null)
  const playbackUrl = useRef<string | null>(null)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      window.clearTimeout(timer.current)
      if (recorder.current?.state === "recording") recorder.current.stop()
      stream.current?.getTracks().forEach((track) => track.stop())
      playback.current?.pause()
      if (playbackUrl.current) URL.revokeObjectURL(playbackUrl.current)
    }
  }, [])
  async function start() {
    setBusy(true)
    setError(null)
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!active.current) {
        media.getTracks().forEach((track) => track.stop())
        return
      }
      stream.current = media
      const next = new MediaRecorder(media)
      recorder.current = next
      const chunks: Blob[] = []
      const started = performance.now()
      next.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data)
      }
      next.onstop = () => {
        window.clearTimeout(timer.current)
        media.getTracks().forEach((track) => track.stop())
        const audio = new Blob(chunks, { type: next.mimeType })
        chunks.length = 0
        if (!active.current) return
        setRecording(false)
        setBusy(true)
        void transcribe(audio, (performance.now() - started) / 1000, locale)
          .then((result) => {
            if (active.current) onText(result.text)
          })
          .catch((e) => {
            if (active.current) setError(e)
          })
          .finally(() => {
            if (active.current) setBusy(false)
          })
      }
      next.start()
      setRecording(true)
      timer.current = window.setTimeout(() => {
        if (next.state === "recording") next.stop()
      }, 60_000)
    } catch (e) {
      stream.current?.getTracks().forEach((track) => track.stop())
      setError(e)
    } finally {
      if (active.current) setBusy(false)
    }
  }
  async function speak() {
    setBusy(true)
    setError(null)
    try {
      const audio = await questionSpeech(questionId, locale)
      if (!active.current) return
      playback.current?.pause()
      if (playbackUrl.current) URL.revokeObjectURL(playbackUrl.current)
      const url = URL.createObjectURL(audio)
      playbackUrl.current = url
      const player = new Audio(url)
      playback.current = player
      player.onended = () => {
        URL.revokeObjectURL(url)
        if (playbackUrl.current === url) playbackUrl.current = null
      }
      await player.play()
    } catch (e) {
      if (active.current) setError(e)
    } finally {
      if (active.current) setBusy(false)
    }
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={locked || busy}
          onClick={() => {
            if (recording) recorder.current?.stop()
            else void start()
          }}
        >
          <Icons.microphone aria-hidden />
          {t(recording ? "stop" : "record")}
        </Button>
        <Button variant="outline" disabled={locked || busy || recording} onClick={() => void speak()}>
          {t("listen")}
        </Button>
      </div>
      {!granted && <p className="text-sm text-muted-foreground">{t("voiceConsent")}</p>}
      {error != null && <StateView state="error" error={error} />}
    </div>
  )
}
