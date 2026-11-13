/**
 * The public address of the card behind a QR token. `shareUrl` is the share app's origin with its base path
 * (`https://share.example/ai`), so the card page `card` hangs off it.
 */
export function cardUrl(shareUrl: string, token: string): string {
  return `${shareUrl.replace(/\/+$/, "")}/card/?t=${encodeURIComponent(token)}`
}
