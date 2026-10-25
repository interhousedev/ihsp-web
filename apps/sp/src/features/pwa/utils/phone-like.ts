/** What `looksLikePhone` needs from the browser. */
export type PhoneEnv = {
  userAgent: string
  maxTouchPoints?: number
  matchMedia: (query: string) => { matches: boolean }
}

/**
 * True on a phone or small touch device whose system the install page does not recognise (not iPhone, not Android):
 * a QR code to "open on your phone" makes no sense there. A mobile user agent, or a touch screen as the main pointer
 * with a narrow window, counts.
 */
export function looksLikePhone({ userAgent, maxTouchPoints = 0, matchMedia }: PhoneEnv): boolean {
  if (/Mobi|Windows Phone|BlackBerry|webOS|Opera Mini/i.test(userAgent)) return true
  return maxTouchPoints > 0 && matchMedia("(pointer: coarse)").matches && matchMedia("(max-width: 820px)").matches
}
