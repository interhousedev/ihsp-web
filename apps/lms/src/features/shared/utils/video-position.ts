const PREFIX = "ihsp:lms:video-position:"
/** Positions before this are not worth resuming; positions this close to the end mean the video was watched. */
const MIN_RESUME_SECONDS = 3
const END_MARGIN_SECONDS = 5

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage
  } catch {
    return null
  }
}

/** The remembered playback position (seconds) of a video, or `null`. Storage may be blocked, so it never throws. */
export function loadVideoPosition(key: string): number | null {
  try {
    const raw = storage()?.getItem(PREFIX + key)
    const value = raw === null || raw === undefined ? NaN : Number(raw)
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

export function saveVideoPosition(key: string, seconds: number): void {
  try {
    storage()?.setItem(PREFIX + key, String(Math.floor(seconds)))
  } catch {
    // private mode or a full quota: the position is only a convenience
  }
}

export function clearVideoPosition(key: string): void {
  try {
    storage()?.removeItem(PREFIX + key)
  } catch {
    // see saveVideoPosition
  }
}

/** Where to continue: the saved position unless it is at the very start or the video is nearly over. */
export function resumeAt(saved: number | null, duration: number): number | null {
  if (saved === null || saved < MIN_RESUME_SECONDS) return null
  if (Number.isFinite(duration) && duration - saved < END_MARGIN_SECONDS) return null
  return saved
}
