"use client"

import type { VideoCaptions } from "@ihsp/api"
import { useEffect, useState } from "react"

/** A caption track ready for `<track>`: `src` is a local `blob:` URL, so the video needs no `crossorigin`. */
export type CaptionSource = { lang: string; label: string; default: boolean; src: string }

/**
 * Downloads each WebVTT track from its short-lived storage URL and keeps it as a `blob:` URL (revoked on change and
 * unmount). A track that fails to load is left out; the video still plays.
 */
export function useCaptionTracks(tracks: VideoCaptions["tracks"] | undefined): CaptionSource[] {
  const [sources, setSources] = useState<CaptionSource[]>([])

  useEffect(() => {
    if (!tracks?.length) {
      setSources([])
      return
    }
    const abort = new AbortController()
    const created: string[] = []
    void Promise.all(
      tracks.map(async (track) => {
        try {
          const response = await fetch(track.url, { signal: abort.signal })
          if (!response.ok) return null
          const src = URL.createObjectURL(new Blob([await response.text()], { type: "text/vtt" }))
          created.push(src)
          return { lang: track.lang, label: track.label, default: track.default, src }
        } catch {
          return null
        }
      }),
    ).then((loaded) => {
      if (!abort.signal.aborted) setSources(loaded.filter((item) => item !== null))
    })
    return () => {
      abort.abort()
      for (const src of created) URL.revokeObjectURL(src)
    }
  }, [tracks])

  return sources
}
