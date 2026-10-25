"use client"

import { useVideoPosition } from "../hooks/use-video-position"

/** A native player for a video file: controls, the first frame as poster (`preload="metadata"`) and a remembered position. */
export function VideoFile({
  src,
  label,
  positionKey,
  poster,
  onError,
}: {
  src: string
  label: string
  /** localStorage key of the position: the file id of an upload, or the link of a direct file. */
  positionKey: string
  poster?: string
  onError?: () => void
}) {
  const position = useVideoPosition(positionKey)
  return (
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
      <track kind="captions" />
    </video>
  )
}
