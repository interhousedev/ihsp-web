const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

/** Random string of `length` characters from `[A-Za-z0-9]` using `crypto.getRandomValues` (no modulo bias). */
export function randomString(length: number): string {
  const limit = 256 - (256 % ALPHANUMERIC.length)
  let result = ""
  while (result.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2))
    for (const byte of bytes) {
      if (byte < limit && result.length < length) result += ALPHANUMERIC[byte % ALPHANUMERIC.length]
    }
  }
  return result
}

export function base64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")
}

/** RFC 7636 verifier: 43 to 128 characters; 64 random alphanumerics are well inside that range. */
export function generateCodeVerifier(): string {
  return randomString(64)
}

/** `S256` challenge: base64url(SHA-256(verifier)). */
export async function codeChallengeS256(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
  return base64Url(new Uint8Array(digest))
}
