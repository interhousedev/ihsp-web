"use client"

import { type SyntheticEvent, useRef } from "react"
import { clearVideoPosition, loadVideoPosition, resumeAt, saveVideoPosition } from "../utils/video-position"

const SAVE_EVERY_SECONDS = 5

/** Handlers for a `<video>` that remember the position in localStorage under `key` and resume from it. */
export function useVideoPosition(key: string) {
  const lastSaved = useRef(0)
  return {
    onLoadedMetadata(event: SyntheticEvent<HTMLVideoElement>) {
      const video = event.currentTarget
      const at = resumeAt(loadVideoPosition(key), video.duration)
      if (at !== null) video.currentTime = at
    },
    onTimeUpdate(event: SyntheticEvent<HTMLVideoElement>) {
      const now = event.currentTarget.currentTime
      if (Math.abs(now - lastSaved.current) < SAVE_EVERY_SECONDS) return
      lastSaved.current = now
      saveVideoPosition(key, now)
    },
    onPause(event: SyntheticEvent<HTMLVideoElement>) {
      const video = event.currentTarget
      if (video.ended) return
      lastSaved.current = video.currentTime
      saveVideoPosition(key, video.currentTime)
    },
    onEnded() {
      lastSaved.current = 0
      clearVideoPosition(key)
    },
  }
}
