/**
 * Follows an absolute http(s) URL (Hydra `redirect_to`, the client's own URL). Anything else (`javascript:`, `data:`)
 * is ignored, so a tampered response can never run script. Kept in one place so tests can replace it.
 */
export function redirectTo(target: string): void {
  let url: URL
  try {
    url = new URL(target, window.location.href)
  } catch {
    return
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return
  window.location.assign(url.toString())
}
