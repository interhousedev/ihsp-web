import { describe, expect, it } from "bun:test"
import { base64Url, codeChallengeS256, generateCodeVerifier, randomString } from "../pkce"

describe("PKCE", () => {
  it("challenge is the base64url SHA-256 of the verifier (RFC 7636 appendix B)", async () => {
    const challenge = await codeChallengeS256("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")

    expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")
  })

  it("base64url has no padding and uses - and _ instead of + and /", () => {
    const encoded = base64Url(new Uint8Array([251, 255, 254, 250]))

    expect(encoded).toBe("-__--g")
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it("verifier is 43 to 128 unreserved characters and differs between calls", () => {
    const first = generateCodeVerifier()
    const second = generateCodeVerifier()

    expect(first).toMatch(/^[A-Za-z0-9]{43,128}$/)
    expect(first).not.toBe(second)
  })

  it("state and nonce strings have the requested length (Hydra needs at least 8)", () => {
    expect(randomString(32)).toHaveLength(32)
    expect(randomString(32)).toMatch(/^[A-Za-z0-9]+$/)
  })
})
