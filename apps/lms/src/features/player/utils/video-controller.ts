/**
 * Play / pause and the current time of a video, the same way for a native `<video>` and for the YouTube and Vimeo
 * iframes. The iframes are driven by their documented postMessage protocols, so no third-party script is loaded
 * (the page CSP allows scripts from 'self' only).
 */
export type VideoController = {
  play: () => void
  pause: () => void
  /** Stops listening. */
  destroy: () => void
}

export type TimeListener = (seconds: number) => void

export function nativeController(video: HTMLVideoElement, onTime: TimeListener): VideoController {
  const listener = () => onTime(video.currentTime)
  video.addEventListener("timeupdate", listener)
  video.addEventListener("seeked", listener)
  return {
    play: () => void video.play().catch(() => undefined),
    pause: () => video.pause(),
    destroy: () => {
      video.removeEventListener("timeupdate", listener)
      video.removeEventListener("seeked", listener)
    },
  }
}

const YOUTUBE_ORIGINS = new Set(["https://www.youtube-nocookie.com", "https://www.youtube.com"])
const VIMEO_ORIGIN = "https://player.vimeo.com"

/** The origin of the frame's address when it is a YouTube origin, otherwise null. */
function youtubeOriginOf(frame: HTMLIFrameElement): string | null {
  try {
    const origin = new URL(frame.src).origin
    return YOUTUBE_ORIGINS.has(origin) ? origin : null
  } catch {
    return null
  }
}

function parse(data: unknown): Record<string, unknown> | null {
  if (typeof data === "string") {
    try {
      const value: unknown = JSON.parse(data)
      return value && typeof value === "object" ? (value as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
  return data && typeof data === "object" ? (data as Record<string, unknown>) : null
}

/** YouTube IFrame API over postMessage: `listening` subscribes, `infoDelivery` carries `currentTime`. */
export function youtubeController(
  frame: HTMLIFrameElement,
  onTime: TimeListener,
  target: Window = window,
): VideoController {
  // The command goes to the frame's own YouTube origin only (never "*"); without one, nothing is sent.
  const post = (message: object) => {
    const origin = youtubeOriginOf(frame)
    if (origin) frame.contentWindow?.postMessage(JSON.stringify(message), origin)
  }
  const command = (func: string) => post({ event: "command", func, args: [] })
  const onMessage = (event: MessageEvent) => {
    if (!YOUTUBE_ORIGINS.has(event.origin) || event.source !== frame.contentWindow) return
    const message = parse(event.data)
    const info = message?.info as { currentTime?: unknown } | undefined
    if (message?.event === "infoDelivery" && typeof info?.currentTime === "number") onTime(info.currentTime)
  }
  const onLoad = () => post({ event: "listening", id: frame.id, channel: "widget" })
  target.addEventListener("message", onMessage)
  frame.addEventListener("load", onLoad)
  onLoad()
  return {
    play: () => command("playVideo"),
    pause: () => command("pauseVideo"),
    destroy: () => {
      target.removeEventListener("message", onMessage)
      frame.removeEventListener("load", onLoad)
    },
  }
}

/** Vimeo Player API over postMessage: subscribe to `timeupdate`, send `play` / `pause`. */
export function vimeoController(
  frame: HTMLIFrameElement,
  onTime: TimeListener,
  target: Window = window,
): VideoController {
  const post = (message: object) => frame.contentWindow?.postMessage(JSON.stringify(message), VIMEO_ORIGIN)
  const onMessage = (event: MessageEvent) => {
    if (event.origin !== VIMEO_ORIGIN || event.source !== frame.contentWindow) return
    const message = parse(event.data)
    if (message?.event === "ready") post({ method: "addEventListener", value: "timeupdate" })
    const data = message?.data as { seconds?: unknown } | undefined
    if (message?.event === "timeupdate" && typeof data?.seconds === "number") onTime(data.seconds)
  }
  target.addEventListener("message", onMessage)
  return {
    play: () => post({ method: "play" }),
    pause: () => post({ method: "pause" }),
    destroy: () => target.removeEventListener("message", onMessage),
  }
}
