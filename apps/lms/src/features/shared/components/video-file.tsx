"use client"

import type { CaptionSource } from "../hooks/use-caption-tracks"
import { useVideoPosition } from "../hooks/use-video-position"

/** A native player for a video file: controls, the first frame as poster (`preload="metadata"`) and a remembered position. */
export function VideoFile({
  src,
  label,
  positionKey,
  poster,
  onError,
  tracks = [],
}: {
  src: string
  label: string
  /** localStorage key of the position: the file id of an upload, or the link of a direct file. */
  positionKey: string
  poster?: string
  onError?: () => void
  /** WebVTT caption tracks (WCAG 1.2.2), already turned into local `blob:` URLs. */
  tracks?: CaptionSource[]
}) {
  const position = useVideoPosition(positionKey)
  return (
    // oxlint-disable-next-line jsx-a11y/media-has-caption -- the captions <track> elements are rendered from `tracks` below
    <video
      src={src}
      controls
      playsInline
      preload="metadata"
      poster={poster}
      aria-label={label}
      onLoadedMetadata={position.onLoadedMetadata}
      onTimeUpdate={position.onTimeUpdate}
      onPause={position.onPause}
      onEnded={position.onEnded}
      onError={onError}
      className="aspect-video w-full rounded-lg border bg-black"
    >
      {tracks.length ? (
        tracks.map((track) => (
          <track
            key={track.lang}
            kind="captions"
            src={track.src}
            srcLang={track.lang}
            label={track.label}
            default={track.default}
          />
        ))
      ) : (
        <track kind="captions" />
      )}
    </video>
  )
}
