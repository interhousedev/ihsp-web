import type { LearningInteraction } from "@ihsp/api"

/** Interactions in time order (the author may add them in any order). */
export function sortInteractions<T extends { at_sec: number }>(items: readonly T[]): T[] {
  return items.toSorted((a, b) => a.at_sec - b.at_sec)
}

/**
 * The interaction the player must stop at when the time moves from `previous` to `current`: the first one in
 * `(previous, current]` that is not done yet. Seeking backwards never triggers; seeking forwards past a pause stops
 * there, so a student cannot skip a question by dragging the slider.
 */
export function dueInteraction(
  sorted: readonly LearningInteraction[],
  previous: number,
  current: number,
  done: ReadonlySet<string>,
): LearningInteraction | null {
  if (current <= previous) return null
  return sorted.find((item) => item.at_sec > previous && item.at_sec <= current && !done.has(item.id)) ?? null
}

/** `m:ss` (or `h:mm:ss`) of a time in seconds. */
export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, "0")
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`
}

/** Parses `90`, `1:30` or `1:02:03` into seconds; null when it is not a time. */
export function parseTime(text: string): number | null {
  const parts = text.trim().split(":")
  if (parts.length === 0 || parts.length > 3 || parts.some((part) => !/^\d+(\.\d+)?$/.test(part))) return null
  return parts.reduce((total, part) => total * 60 + Number(part), 0)
}

/** Which player drives a link: the YouTube or Vimeo iframe (controlled by postMessage) or a native video. */
export type VideoSourceKind =
  | { kind: "youtube"; id: string }
  | { kind: "vimeo"; id: string }
  | { kind: "file"; src: string }
  | { kind: "none" }

export function videoSource(url: string): VideoSourceKind {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return { kind: "none" }
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return { kind: "none" }
  const host = parsed.hostname.replace(/^www\./, "")
  const youtube =
    host === "youtu.be"
      ? parsed.pathname.slice(1)
      : host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com"
        ? (parsed.searchParams.get("v") ?? parsed.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1])
        : null
  if (youtube !== null && youtube !== undefined) {
    return /^[\w-]{6,20}$/.test(youtube) ? { kind: "youtube", id: youtube } : { kind: "none" }
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = parsed.pathname.match(/\/(\d+)/)?.[1]
    return id ? { kind: "vimeo", id } : { kind: "none" }
  }
  return { kind: "file", src: parsed.toString() }
}

/** The embed URL with the JS API switched on (YouTube needs the page origin to post messages back). */
export function embedUrl(source: { kind: "youtube" | "vimeo"; id: string }, origin: string): string {
  if (source.kind === "youtube") {
    const query = new URLSearchParams({ enablejsapi: "1", origin, playsinline: "1", rel: "0" })
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(source.id)}?${query}`
  }
  return `https://player.vimeo.com/video/${source.id}?api=1&playsinline=1`
}
