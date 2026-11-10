// The map of app pages (GET /v1/app-map): where a feature lives, for the help widget and the assistant.

export type AppMapApp = "sp" | "staff" | "admin" | "lms" | "library" | "id" | "bot"

/** One page of an app (or a bot command, which has no URL). `title` is keyed by locale (`uz`, `ru`, `en`). */
export type AppMapItem = {
  id: string
  app: AppMapApp | (string & {})
  path: string
  url: string | null
  title: Record<string, string>
  keywords: string[]
}

export type AppMapResponse = { items: AppMapItem[] }
