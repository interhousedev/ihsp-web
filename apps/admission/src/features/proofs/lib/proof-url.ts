/** Why a proof URL is refused; the backend (`invalid_proof_url`) stays the authority, this is the early hint. */
export type ProofUrlProblem = "empty" | "length" | "malformed" | "scheme" | "port" | "host"

/** The backend's `PROOF_URL_MAX`; also the `maxLength` of the schema (`url ≤ 2048`). */
export const PROOF_URL_MAX = 2048

const BLOCKED_SUFFIXES = [".local", ".internal", ".localhost", ".lan", ".home", ".corp"]

/** `null` when `value` is a public https URL on port 443 without credentials, otherwise the first problem. */
export function validateProofUrl(value: string): ProofUrlProblem | null {
  const text = value.trim()
  if (!text) return "empty"
  if (text.length > PROOF_URL_MAX) return "length"
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return "malformed"
  }
  if (url.protocol !== "https:" || url.username || url.password) return "scheme"
  if (url.port && url.port !== "443") return "port"
  const host = url.hostname.toLowerCase().replace(/\.$/, "")
  if (!host.includes(".") || host === "localhost" || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) return "host"
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.startsWith("[")) return "host"
  return null
}
