/**
 * Returns the URL when it is an absolute `http(s)` address, otherwise `undefined`. Backend-supplied and feed-supplied
 * links (`logout_url`, external viewers, reading-list entries, file download targets) go through this before they land
 * in an `href` or `location.assign`, so a `javascript:` or `data:` URL that reached the API through another client can
 * never run as script here.
 */
export function safeHttpUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return undefined
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return undefined
  return url.toString()
}
