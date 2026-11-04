import { hrefs } from "./hrefs"

/**
 * The unified course page lives at `/course/<slug or id>/` and `/course/<courseId>/step/<stepId>/`. Every app is a static
 * export, so one shell (`/course/shell/`) answers all of them: nginx (deploy/sites/lms.conf) and the dev rewrite
 * (next.config.ts) serve it, and the page reads the ids from `window.location`. The old query links land on real folders
 * of the app and redirect from here.
 */
export type CourseUrl =
  | { kind: "player"; courseId: string; stepId: string; block: number | null }
  | { kind: "entry"; ref: string; preview: boolean }
  | { kind: "redirect"; href: string }
  | { kind: "missing" }

function positiveInt(value: string | null): number | null {
  const number = Number(value)
  return value !== null && Number.isInteger(number) && number > 0 ? number : null
}

function withTab(href: string, tab: string | null): string {
  if (!tab) return href
  return `${href}${href.includes("?") ? "&" : "?"}tab=${encodeURIComponent(tab)}`
}

export function resolveCourseUrl(pathname: string, search: string): CourseUrl {
  const params = new URLSearchParams(search)
  const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent)
  const [root, first, second, third] = parts
  if (root !== "course") return { kind: "missing" }

  if (first === undefined || first === "step" || first === "about" || first === "shell") {
    const course = params.get("course")
    const step = params.get("step")
    if (course && step)
      return { kind: "redirect", href: hrefs.step(course, step, positiveInt(params.get("block")) ?? undefined) }
    const slug = params.get("slug") ?? course
    if (!slug) return { kind: "missing" }
    const preview = params.get("preview") === "1"
    const href = hrefs.course(slug, preview)
    // A slug that is also a folder of the app has no address in the path: it stays on the query form.
    if (href.startsWith("/course/?")) return { kind: "entry", ref: slug, preview }
    return { kind: "redirect", href: withTab(href, params.get("tab")) }
  }

  if (second === undefined) return { kind: "entry", ref: first, preview: params.get("preview") === "1" }
  if (second === "step" && third !== undefined)
    return { kind: "player", courseId: first, stepId: third, block: positiveInt(params.get("block")) }
  return { kind: "missing" }
}

/** Whether this address is drawn by the same page as the current one, so it can open without loading a document. */
export function isPlayerPath(pathname: string): boolean {
  return /^\/course\/[^/]+\/step\/[^/]+\/?$/.test(pathname)
}
