/**
 * The address of a page as a report sends it: origin and path only. The query and the hash are dropped, because they
 * can carry OAuth codes, tokens or record ids. Returns undefined when the address has no origin (for example
 * `about:blank`) or cannot be parsed.
 */
export function pageAddressOf(href: string): string | undefined {
  try {
    const url = new URL(href)
    if (url.origin === "null") return undefined
    return `${url.origin}${url.pathname}`
  } catch {
    return undefined
  }
}
