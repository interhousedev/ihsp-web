"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  VOICE_BITRATE,
  VOICE_MAX_MS,
  WAVE_HISTORY,
  levelFromBytes,
  pickRecordingFormat,
  voiceErrorKey,
  type RecordingFormat,
  type VoiceErrorKey,
} from "./voice-format"
import type { VoiceClip } from "./voice-transcribe"

/** 80 ms per sample: 12.5 frames per second, under the 30 fps cap of the waveform. */
const LEVEL_EVERY_MS = 80

/** The recording format of this browser, or null when it cannot record (no MediaRecorder, e.g. a Telegram webview). */
export function recordingFormat(): RecordingFormat | null {
  if (typeof MediaRecorder === "undefined" || typeof navigator === "undefined") return null
  if (!navigator.mediaDevices?.getUserMedia) return null
  return pickRecordingFormat((type) => MediaRecorder.isTypeSupported(type))
}

type Session = {
  recorder: MediaRecorder
  stream: MediaStream
  format: RecordingFormat
  chunks: Blob[]
  startedAt: number
  context: AudioContext | null
  levelTimer: number | undefined
  limitTimer: number | undefined
  /** Set when the recording is dropped (cancel, unmount): its clip is never handed out. */
  discard: boolean
  released?: boolean
  done?: (clip: VoiceClip | null) => void
}

export type VoiceRecorder = {
  /** A recording is running. */
  recording: boolean
  /** The newest loudness levels (0 to 1), one per tick, for the waveform. */
  levels: number[]
  /** Starts a recording; resolves with the reason it could not start, or null. */
  start: () => Promise<VoiceErrorKey | null>
  /** Stops and resolves with the recorded clip (null when nothing was recorded). */
  finish: () => Promise<VoiceClip | null>
  /** Stops and drops the recording. */
  cancel: () => void
}

/**
 * One microphone recording at a time: mono, low bitrate, a live level per tick from an analyser, stopped by
 * `finish`, `cancel`, the length cap (`onLimit` then gets the clip) or unmount. Every track is released on the way out.
 */
export function useVoiceRecorder(onLimit?: (clip: VoiceClip) => void): VoiceRecorder {
  const session = useRef<Session | null>(null)
  const mounted = useRef(false)
  const limitRef = useRef(onLimit)
  useEffect(() => {
    limitRef.current = onLimit
  })
  const [recording, setRecording] = useState(false)
  const [levels, setLevels] = useState<number[]>([])

  const release = useCallback((current: Session) => {
    // Idempotent: stopping the recorder also runs `onstop`, which releases once more.
    if (current.released) return
    current.released = true
    if (current.levelTimer !== undefined) window.clearInterval(current.levelTimer)
    if (current.limitTimer !== undefined) window.clearTimeout(current.limitTimer)
    current.stream.getTracks().forEach((track) => track.stop())
    void current.context?.close().catch(() => undefined)
  }, [])

  const finish = useCallback((): Promise<VoiceClip | null> => {
    const current = session.current
    if (!current) return Promise.resolve(null)
    session.current = null
    setRecording(false)
    return new Promise((resolve) => {
      current.done = resolve
      if (current.recorder.state === "inactive") {
        release(current)
        resolve(null)
      } else {
        current.recorder.stop()
      }
    })
  }, [release])

  const cancel = useCallback(() => {
    const current = session.current
    if (!current) return
    session.current = null
    current.discard = true
    setRecording(false)
    setLevels([])
    if (current.recorder.state !== "inactive") current.recorder.stop()
    release(current)
  }, [release])

  const start = useCallback(async (): Promise<VoiceErrorKey | null> => {
    if (session.current) return null
    const format = recordingFormat()
    if (!format) return "failed"
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
    } catch (error) {
      return voiceErrorKey(error)
    }
    // Unmounted while the permission was pending: the microphone is handed straight back.
    if (!mounted.current || session.current) {
      stream.getTracks().forEach((track) => track.stop())
      return null
    }
    const recorder = new MediaRecorder(stream, { mimeType: format.recorderType, audioBitsPerSecond: VOICE_BITRATE })
    const current: Session = {
      recorder,
      stream,
      format,
      chunks: [],
      startedAt: Date.now(),
      context: null,
      levelTimer: undefined,
      limitTimer: undefined,
      discard: false,
    }
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) current.chunks.push(event.data)
    }
    recorder.onstop = () => {
      release(current)
      const clip: VoiceClip | null =
        current.discard || current.chunks.length === 0
          ? null
          : {
              blob: new Blob(current.chunks, { type: current.format.uploadType }),
              durationMs: Date.now() - current.startedAt,
              type: current.format.uploadType,
              extension: current.format.extension,
            }
      current.done?.(clip)
    }
    if (typeof AudioContext !== "undefined") {
      const context = new AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      context.createMediaStreamSource(stream).connect(analyser)
      const samples = new Uint8Array(analyser.fftSize)
      current.context = context
      current.levelTimer = window.setInterval(() => {
        analyser.getByteTimeDomainData(samples)
        const level = levelFromBytes(samples)
        setLevels((previous) => [...previous.slice(-(WAVE_HISTORY - 1)), level])
      }, LEVEL_EVERY_MS)
    }
    current.limitTimer = window.setTimeout(() => {
      void finish().then((clip) => {
        if (clip) limitRef.current?.(clip)
      })
    }, VOICE_MAX_MS)
    session.current = current
    setLevels([])
    setRecording(true)
    recorder.start()
    return null
  }, [finish, release])

  // Unmount: the recording is dropped and the microphone released at once.
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      const current = session.current
      if (!current) return
      session.current = null
      current.discard = true
      if (current.recorder.state !== "inactive") current.recorder.stop()
      release(current)
    }
  }, [release])

  return { recording, levels, start, finish, cancel }
}
