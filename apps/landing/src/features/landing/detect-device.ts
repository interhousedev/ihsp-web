import type { DeviceKind } from "../../components/device-mockup/device-frame"

export interface DeviceSignals {
  /** `navigator.userAgentData` (UA client hints), when the browser has it. */
  readonly uaData?: { readonly mobile?: boolean; readonly platform?: string } | null
  readonly userAgent: string
  /** `matchMedia("(pointer: coarse)").matches`. */
  readonly coarsePointer: boolean
  readonly width: number
  readonly maxTouchPoints?: number
}

const TABLET_UA = /iPad|Tablet|PlayBook|Silk|Kindle|Android(?!.*Mobile)/i
const PHONE_UA = /iPhone|iPod|Android.*Mobile|Windows Phone|Mobi/i
const DESKTOP_PLATFORMS = /^(windows|macos|linux|chrome os|chromeos)$/i

/**
 * Which device the visitor most likely holds: UA client hints first, then the UA string, then the pointer and
 * the viewport width. A foldable is never guessed: it is only picked by hand.
 */
export function detectDevice(signals: DeviceSignals): DeviceKind {
  const { uaData, userAgent, coarsePointer, width, maxTouchPoints = 0 } = signals
  if (uaData && typeof uaData.mobile === "boolean") {
    if (uaData.mobile) return "phone"
    const platform = uaData.platform ?? ""
    if (DESKTOP_PLATFORMS.test(platform)) {
      // iPadOS in desktop mode reports macOS but has a touch screen.
      return /macos/i.test(platform) && maxTouchPoints > 1 && coarsePointer ? "tablet" : "laptop"
    }
    if (/android|ios/i.test(platform)) return "tablet"
  }
  if (TABLET_UA.test(userAgent)) return "tablet"
  if (PHONE_UA.test(userAgent)) return "phone"
  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) return "tablet"
  if (coarsePointer) {
    if (width < 600) return "phone"
    if (width < 1100) return "tablet"
  }
  return "laptop"
}

/** Reads the signals from the browser; only call after mount. */
export function readDeviceSignals(): DeviceSignals {
  const nav = navigator as Navigator & { userAgentData?: DeviceSignals["uaData"] }
  return {
    uaData: nav.userAgentData ?? null,
    userAgent: nav.userAgent,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    width: window.innerWidth,
    maxTouchPoints: nav.maxTouchPoints,
  }
}
