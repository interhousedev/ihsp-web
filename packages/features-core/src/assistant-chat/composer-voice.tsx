"use client"

import { useT } from "@ihsp/i18n"
import { Button, IconArrowUp, IconLoader2, IconX } from "@ihsp/ui"
import { useCallback, useRef, useState } from "react"
import { WAVE_BAR_PX, WAVE_PITCH_PX, waveSlots } from "./voice-format"

export type VoiceBarPhase = "recording" | "transcribing"

/** A level at or under this is silence: it is drawn as a dot on the baseline, not as a bar. */
const SILENCE = 0.02

type ComposerVoiceBarProps = {
  phase: VoiceBarPhase
  /** Newest loudness levels (0 to 1), oldest first; the newest is drawn on the right. */
  levels: readonly number[]
  onCancel: () => void
  /** Stops the recording; the transcript goes into the field for editing. */
  onStop: () => void
  /** Stops the recording; the transcript is sent as a message. */
  onSend: () => void
}

/**
 * The pill while the microphone is on (a scrolling waveform, cancel, stop, stop and send) and while the recording is
 * transcribed (the stop circle turns into a spinner). It takes the place of the text field, so the draft is untouched.
 */
export function ComposerVoiceBar({ phase, levels, onCancel, onStop, onSend }: ComposerVoiceBarProps) {
  const t = useT("assistant.composer.voice")
  const recording = phase === "recording"
  const [width, setWidth] = useState(0)
  const observer = useRef<ResizeObserver | null>(null)

  // The waveform fills the width it is given: one bar per pitch, the newest level always on the right. The callback
  // ref watches the element while it is mounted (it exists only while recording).
  const waveRef = useCallback((element: HTMLDivElement | null) => {
    observer.current?.disconnect()
    observer.current = null
    if (!element || typeof ResizeObserver === "undefined") return
    observer.current = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0))
    observer.current.observe(element)
  }, [])

  const slots = waveSlots(width)
  const visible = levels.slice(-slots)
  const padded = [...Array.from({ length: slots - visible.length }, () => 0), ...visible]

  return (
    <div className="flex min-h-11 items-center gap-1 px-1 py-0.5" data-testid="voice-bar" data-phase={phase}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 shrink-0 rounded-full"
        aria-label={t("cancel")}
        onClick={onCancel}
      >
        <IconX aria-hidden />
      </Button>
      {recording ? (
        <div
          ref={waveRef}
          role="img"
          aria-label={t("waveform")}
          className="flex h-11 min-w-0 flex-1 items-center overflow-hidden px-2"
          style={{ gap: WAVE_PITCH_PX - WAVE_BAR_PX }}
        >
          {padded.map((level, index) =>
            level > SILENCE ? (
              <span
                key={index}
                aria-hidden
                data-wave="bar"
                className="bg-foreground/85 shrink-0 rounded-full transition-[height] duration-100 motion-reduce:transition-none"
                style={{ width: WAVE_BAR_PX, height: `${Math.max(12, Math.round(level * 100))}%` }}
              />
            ) : (
              <span
                key={index}
                aria-hidden
                data-wave="dot"
                className="bg-foreground/35 shrink-0 rounded-full"
                style={{ width: WAVE_BAR_PX, height: WAVE_BAR_PX }}
              />
            ),
          )}
        </div>
      ) : (
        <p role="status" className="text-muted-foreground flex min-w-0 flex-1 items-center justify-center text-sm">
          {t("transcribing")}
        </p>
      )}
      {recording ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0 rounded-full"
          aria-label={t("stop")}
          onClick={onStop}
        >
          <span data-stop-square className="bg-foreground size-3.5 rounded-[3px]" aria-hidden />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0 rounded-full"
          aria-label={t("transcribing")}
          aria-busy="true"
          disabled
        >
          <IconLoader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
        </Button>
      )}
      <Button
        type="button"
        size="icon"
        className="size-11 shrink-0 rounded-full"
        aria-label={t("send")}
        aria-disabled={!recording}
        onClick={recording ? onSend : undefined}
      >
        <IconArrowUp aria-hidden />
      </Button>
    </div>
  )
}
