import { mock } from "bun:test"
/**
 * A stand-in for Next's app router in unit tests. `preload.ts` installs it as the `next/navigation` module, so
 * `usePathname`, `useSearchParams` and `useRouter` work without the Next.js runtime.
 */
const state = { pathname: "/", search: "" }

let cachedSearch = ""
let cachedParams = new URLSearchParams()

/** Same object while the query string is unchanged, like the real hook (effects depend on it). */
function currentSearchParams(): URLSearchParams {
  if (cachedSearch !== state.search) {
    cachedSearch = state.search
    cachedParams = new URLSearchParams(state.search)
  }
  return cachedParams
}

export const testRouter = {
  push: mock((_href: string) => undefined),
  replace: mock((_href: string) => undefined),
  back: mock(() => undefined),
  forward: mock(() => undefined),
  refresh: mock(() => undefined),
  prefetch: mock((_href: string) => undefined),
}

/** Sets the current location, e.g. `setTestRoute("/lessons/view/?id=l-1")`. Also updates `window.history`. */
export function setTestRoute(href: string): void {
  const url = new URL(href, "http://localhost:3000")
  state.pathname = url.pathname
  state.search = url.search
  // Test files share one process; a test that navigated away (or closed the window) leaves `about:blank`, where a
  // relative `replaceState` is ignored. Components that read `location` directly (the share viewer) need a real URL.
  // A test that followed a redirect to another origin (the Hydra authorize URL) leaves that origin behind; a relative
  // `replaceState` keeps it, which breaks code that builds URLs from `window.location.origin`.
  if (window.location.protocol === "about:" || window.location.origin !== "http://localhost:3000") {
    ;(window as unknown as { happyDOM?: { setURL: (value: string) => void } }).happyDOM?.setURL(
      "http://localhost:3000/",
    )
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}`)
}

export function getTestRoute(): { pathname: string; search: string } {
  return { ...state }
}

export function resetTestRouter(): void {
  for (const fn of Object.values(testRouter)) fn.mockClear()
  setTestRoute("/")
}

/** Exports of the mocked `next/navigation` module. */
export const testNavigation = {
  usePathname: () => state.pathname,
  useSearchParams: currentSearchParams,
  useRouter: () => testRouter,
  useParams: () => ({}),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
  redirect: (href: string) => {
    testRouter.replace(href)
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
}
