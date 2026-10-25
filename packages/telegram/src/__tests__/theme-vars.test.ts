import { describe, expect, it } from "bun:test"
import { getInitDataRaw, isMiniApp } from "../is-mini-app"
import { themeParamsToCssVars } from "../theme-vars"

describe("themeParamsToCssVars", () => {
  it("maps Telegram theme colors to the design tokens", () => {
    const vars = themeParamsToCssVars({
      bgColor: "#17212b",
      textColor: "#f5f5f5",
      hintColor: "#708499",
      buttonColor: "#5288c1",
      buttonTextColor: "#ffffff",
      secondaryBgColor: "#232e3c",
    })

    expect(vars["--background"]).toBe("#17212b")
    expect(vars["--foreground"]).toBe("#f5f5f5")
    expect(vars["--muted-foreground"]).toBe("#708499")
    expect(vars["--primary"]).toBe("#5288c1")
    expect(vars["--primary-foreground"]).toBe("#ffffff")
    expect(vars["--card"]).toBe("#232e3c")
  })

  it("leaves out tokens without a Telegram color so the app theme stays", () => {
    const vars = themeParamsToCssVars({ bgColor: "#ffffff" })

    expect(vars["--background"]).toBe("#ffffff")
    expect("--primary" in vars).toBe(false)
    expect("--destructive" in vars).toBe(false)
  })
})

describe("outside Telegram", () => {
  it("is not a mini app and has no initData", () => {
    expect(isMiniApp()).toBe(false)
    expect(getInitDataRaw()).toBeUndefined()
  })
})
