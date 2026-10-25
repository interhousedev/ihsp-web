/**
 * Installing an app through the apps hub (`app.ihsu.uz`). A browser installs a web app only from the app's own origin
 * (its manifest's scope and start URL), so the hub cannot install Library, LMS or Staff itself: its page for an app
 * (`/install/?app=library`) explains the steps and opens the app's own address with `?install=1`, and the app then offers
 * its install dialog or the steps for this browser at once.
 */

/** The query parameter an app is opened with to offer its own install right away. */
export const INSTALL_REQUEST_PARAM = "install"

/** The hub's path of the per-app install pages. */
export const HUB_INSTALL_PATH = "/install/"

/** Removes trailing slashes with a linear scan (a `/\/+$/` regex is quadratic on long runs of slashes). */
function trimTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && value.charCodeAt(end - 1) === 47) end--
  return value.slice(0, end)
}

/** `https://app.ihsu.uz` + `library` → `https://app.ihsu.uz/install/?app=library`. */
export function hubInstallUrl(hub: string, key: string): string {
  return `${trimTrailingSlashes(hub)}${HUB_INSTALL_PATH}?app=${encodeURIComponent(key)}`
}

/** `https://lib.ihsu.uz` → `https://lib.ihsu.uz/?install=1`: the app opens and offers to install itself. */
export function installRequestUrl(appUrl: string): string {
  return `${trimTrailingSlashes(appUrl)}/?${INSTALL_REQUEST_PARAM}=1`
}

/** True when this page was opened with `?install=1`. */
export function hasInstallRequest(): boolean {
  if (typeof window === "undefined") return false
  return new URL(window.location.href).searchParams.get(INSTALL_REQUEST_PARAM) === "1"
}

/** Removes `?install=1` from the address bar, so a reload or a bookmark does not ask again. */
export function clearInstallRequest(): void {
  const url = new URL(window.location.href)
  if (!url.searchParams.has(INSTALL_REQUEST_PARAM)) return
  url.searchParams.delete(INSTALL_REQUEST_PARAM)
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
}
