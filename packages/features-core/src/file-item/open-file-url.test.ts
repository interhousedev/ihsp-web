import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import { openFileUrl } from "./open-file-url"

type ProxyWindow = { TelegramWebviewProxy?: { postEvent: () => void } }

const URL_A = "https://s3.test/a"
const realOpen = window.open
let opened: ReturnType<typeof mock>

/** `isMiniApp()` is true when the webview proxy exists; the SDK itself is replaced by the injected loader. */
function enterTelegram() {
  ;(window as unknown as ProxyWindow).TelegramWebviewProxy = { postEvent: () => undefined }
}

beforeEach(() => {
  opened = mock(() => null)
  window.open = opened as unknown as typeof window.open
})
afterEach(() => {
  delete (window as unknown as ProxyWindow).TelegramWebviewProxy
  window.open = realOpen
})

describe("openFileUrl", () => {
  it("leaves through the Telegram SDK inside the mini app and opens no popup", async () => {
    enterTelegram()
    const openExternalLink = mock((_url: string) => true)
    await openFileUrl(URL_A, async () => ({ openExternalLink }))
    expect(openExternalLink).toHaveBeenCalledWith(URL_A)
    expect(opened).not.toHaveBeenCalled()
  })

  it("falls back to a safe new tab when the SDK cannot open links", async () => {
    enterTelegram()
    await openFileUrl(URL_A, async () => ({ openExternalLink: () => false }))
    expect(opened).toHaveBeenCalledWith(URL_A, "_blank", "noopener,noreferrer")
  })

  it("does not load the SDK outside Telegram", async () => {
    const load = mock(async () => ({ openExternalLink: () => true }))
    await openFileUrl(URL_A, load)
    expect(load).not.toHaveBeenCalled()
    expect(opened).toHaveBeenCalledWith(URL_A, "_blank", "noopener,noreferrer")
  })
})
