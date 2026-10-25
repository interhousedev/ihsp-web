import { afterEach, describe, expect, it } from "bun:test"
import { getInitDataRaw, isMiniApp, launchParamsQuery } from "../launch-params"

const LAUNCH = "tgWebAppPlatform=ios&tgWebAppVersion=8.0&tgWebAppData=query_id%3DAAE%26hash%3Dabc"

afterEach(() => {
  window.history.replaceState(null, "", "/")
  window.sessionStorage.clear()
  delete (window as { TelegramWebviewProxy?: unknown }).TelegramWebviewProxy
})

describe("launch params without the SDK", () => {
  it("is not a mini app in a plain browser", () => {
    expect(isMiniApp()).toBe(false)
    expect(getInitDataRaw()).toBeUndefined()
  })

  it("reads the launch parameters from the URL hash and gives the raw init data", () => {
    window.history.replaceState(null, "", `/#${LAUNCH}`)
    expect(isMiniApp()).toBe(true)
    expect(launchParamsQuery()).toBe(LAUNCH)
    expect(getInitDataRaw()).toBe("query_id=AAE&hash=abc")
  })

  it("remembers the launch parameters for later pages, the way the SDK does", () => {
    window.history.replaceState(null, "", `/#${LAUNCH}`)
    expect(isMiniApp()).toBe(true)
    window.history.replaceState(null, "", "/grades/")
    expect(isMiniApp()).toBe(true)
    expect(getInitDataRaw()).toBe("query_id=AAE&hash=abc")
  })

  it("falls back to the session key the SDK writes (a JSON string)", () => {
    window.sessionStorage.setItem("tapps/launchParams", JSON.stringify(LAUNCH))
    expect(isMiniApp()).toBe(true)
    expect(getInitDataRaw()).toBe("query_id=AAE&hash=abc")
  })

  it("ignores a hash without tgWebAppPlatform and a broken session value", () => {
    window.history.replaceState(null, "", "/#tab=day")
    window.sessionStorage.setItem("tapps/launchParams", "{not json")
    expect(isMiniApp()).toBe(false)
  })

  it("trusts the native webview proxy", () => {
    ;(window as { TelegramWebviewProxy?: unknown }).TelegramWebviewProxy = { postEvent: () => undefined }
    expect(isMiniApp()).toBe(true)
    expect(getInitDataRaw()).toBeUndefined()
  })
})
