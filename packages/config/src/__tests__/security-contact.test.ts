import { describe, expect, it } from "bun:test"
import { TEST_ENV } from "@ihsp/test-utils"
import { getConfig, resetConfig } from "../index"

function setEnv(env: Record<string, unknown>) {
  window.__ENV__ = env
  resetConfig()
}

describe("SECURITY_CONTACT (IHSP_WEB_SECURITY_CONTACT)", () => {
  it("passes the contact text through unchanged", () => {
    setEnv({ ...TEST_ENV, SECURITY_CONTACT: "alex@sayfi.uz, @megaplov (Telegram)" })

    expect(getConfig().SECURITY_CONTACT).toBe("alex@sayfi.uz, @megaplov (Telegram)")
  })

  it("treats an empty value (the button is hidden) as absent", () => {
    setEnv({ ...TEST_ENV, SECURITY_CONTACT: "" })

    expect(getConfig().SECURITY_CONTACT).toBeUndefined()
  })

  it("is optional: an env.js without it is still valid", () => {
    const { SECURITY_CONTACT: _removed, ...rest } = TEST_ENV
    setEnv(rest)

    expect(getConfig().SECURITY_CONTACT).toBeUndefined()
  })
})
