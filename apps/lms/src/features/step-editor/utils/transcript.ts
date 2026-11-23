import { formatTime } from "../../player/utils/interactive-video"

/** A subtitle cue: its start and end in seconds and its text on one line. */
export type Cue = { start: number; end: number; text: string }

const TIMING = /^\s*((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})\s*-->\s*((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})/

/** `00:01:02.500`, `01:02,500` or `1:02:03.000` into seconds. */
export function cueSeconds(stamp: string): number {
  const parts = stamp.replace(",", ".").split(":").map(Number)
  return parts.reduce((total, part) => total * 60 + part, 0)
}

/**
 * The cues of a WebVTT or SubRip file. Cue numbers, the `WEBVTT` header, `NOTE`/`STYLE` blocks and inline tags
 * (`<v Speaker>`, `<b>`, `{\an8}`) are dropped; a cue repeated by rolling captions is kept once.
 */
export function parseSubtitles(source: string): Cue[] {
  const cues: Cue[] = []
  const blocks = source
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
  for (const block of blocks) {
    const lines = block.split("\n")
    const at = lines.findIndex((line) => TIMING.test(line))
    if (at === -1) continue
    const match = TIMING.exec(lines[at] ?? "")
    if (!match?.[1] || !match[2]) continue
    const text = lines
      .slice(at + 1)
      .join(" ")
      .replace(/<[^>]*>/g, "")
      .replace(/\{\\[^}]*\}/g, "")
      .replace(/\s+/g, " ")
      .trim()
    if (!text) continue
    const previous = cues.at(-1)
    if (previous && previous.text === text) {
      previous.end = cueSeconds(match[2])
      continue
    }
    cues.push({ start: cueSeconds(match[1]), end: cueSeconds(match[2]), text })
  }
  return cues
}

/** True when the text looks like a subtitle file rather than a plain transcript. */
export function isSubtitles(source: string): boolean {
  return source.split(/\r?\n/).some((line) => TIMING.test(line))
}

/** Plain transcript text for the backend: one `m:ss text` line per cue. */
export function cuesToTranscript(cues: readonly Cue[]): string {
  return cues.map((cue) => `${formatTime(cue.start)} ${cue.text}`).join("\n")
}

/**
 * What the author pasted or uploaded, ready to send: subtitles become timed lines and give the video length; plain
 * text is sent as it is.
 */
export function prepareTranscript(source: string): { transcript: string; durationSeconds: number | null } {
  if (!isSubtitles(source)) return { transcript: source.trim(), durationSeconds: null }
  const cues = parseSubtitles(source)
  const end = cues.reduce((max, cue) => Math.max(max, cue.end), 0)
  return { transcript: cuesToTranscript(cues), durationSeconds: end > 0 ? end : null }
}
