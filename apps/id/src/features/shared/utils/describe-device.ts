export type DeviceInfo = { browser: string | null; os: string | null }

const BROWSERS: [RegExp, string][] = [
  [/Telegram/i, "Telegram"],
  [/Edg\//, "Edge"],
  [/OPR\//, "Opera"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
]

const SYSTEMS: [RegExp, string][] = [
  [/iPhone/, "iOS"],
  [/iPad/, "iPadOS"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Linux/, "Linux"],
]

function firstMatch(table: [RegExp, string][], text: string): string | null {
  return table.find(([pattern]) => pattern.test(text))?.[1] ?? null
}

/** A short "Chrome on Windows" style description of a user agent; `null` parts when it is not recognised. */
export function describeDevice(userAgent: string | null): DeviceInfo {
  if (!userAgent) return { browser: null, os: null }
  return { browser: firstMatch(BROWSERS, userAgent), os: firstMatch(SYSTEMS, userAgent) }
}
