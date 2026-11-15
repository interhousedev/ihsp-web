/**
 * Recovery from a stale bundle: old JavaScript (a tab or a cached page from before a deployment) that meets newer
 * messages shows raw keys. The build is identified by the hashed `/_next/static/` scripts the page loads; the current
 * deployment is read from a fresh, uncached copy of the page. The reload happens only when the two differ, and once per
 * deployed build, so a later deployment can heal again and a genuinely missing key never causes a reload loop.
 */

const RELOAD_FLAG = "ihsp:i18n-stale-reload"
const SCRIPT_SRC = /<script\b[^>]*?\bsrc=["']([^"']+)["']/gi

/** The sorted `/_next/static/` script paths of an HTML document; the identity of the build that produced it. */
export function buildIdFromHtml(html: string): string {
  return buildIdFromSources([...html.matchAll(SCRIPT_SRC)].map((match) => match[1]!))
}

export function buildIdFromSources(sources: readonly string[]): string {
  const paths = new Set<string>()
  for (const source of sources) {
    const path = source.split(/[?#]/)[0]!
    const index = path.indexOf("/_next/static/")
    if (index >= 0) paths.add(path.slice(index))
  }
  return [...paths].sort().join("|")
}

export type StaleBuildEnv = {
  /** Identity of the running build (from the scripts of the current document). */
  running: string
  /** Identity of the deployed build; `null` when it could not be read (offline, error): nothing is done then. */
  fetchDeployed: () => Promise<string | null>
  storage: Pick<Storage, "getItem" | "setItem">
  reload: () => void
}

/** Reloads when the deployed build differs from the running one and this deployment has not been tried yet. */
export async function reloadIfBuildIsStale(
  env: StaleBuildEnv,
): Promise<"reloaded" | "same-build" | "already-tried" | "unknown"> {
  const deployed = await env.fetchDeployed()
  if (!deployed) return "unknown"
  if (deployed === env.running) return "same-build"
  try {
    if (env.storage.getItem(RELOAD_FLAG) === deployed) return "already-tried"
    env.storage.setItem(RELOAD_FLAG, deployed)
  } catch {
    return "unknown"
  }
  env.reload()
  return "reloaded"
}

let checking = false

/** Browser entry: called when a message key is missing in production. At most one check runs at a time. */
export function checkStaleBuildInBrowser(): void {
  if (checking || typeof window === "undefined") return
  checking = true
  const running = buildIdFromSources(
    [...document.querySelectorAll("script[src]")].map((node) => node.getAttribute("src") ?? ""),
  )
  reloadIfBuildIsStale({
    running,
    fetchDeployed: async () => {
      const response = await fetch(window.location.pathname, { cache: "no-store", headers: { accept: "text/html" } })
      return response.ok ? buildIdFromHtml(await response.text()) || null : null
    },
    storage: window.sessionStorage,
    reload: () => window.location.reload(),
  })
    .catch(() => undefined)
    .finally(() => {
      checking = false
    })
}
