/** Which wallet buttons a device gets: Apple devices the Apple one, Android the Google one, the rest both. */
export type WalletPlatform = "apple" | "android" | "other"

/** iPhone, iPad (which reports itself as a Mac) and Mac are Apple; Android is Android. */
export function walletPlatform({ userAgent, platform = "" }: { userAgent: string; platform?: string }): WalletPlatform {
  if (/Android/i.test(userAgent)) return "android"
  if (/iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(userAgent) || /^(Mac|iPhone|iPad|iPod)/.test(platform)) return "apple"
  return "other"
}

/** The wallet platform of this browser; `other` outside a browser. */
export function currentWalletPlatform(): WalletPlatform {
  if (typeof navigator === "undefined") return "other"
  return walletPlatform({ userAgent: navigator.userAgent, platform: navigator.platform })
}
