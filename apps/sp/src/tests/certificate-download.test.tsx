/** A certificate file leaves as a blob in the browser and through a signed address inside the mini app. */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { CertificatesSection } from "../features/profile/components/certificates-section"
import { configureTests, renderSp } from "./helpers"

configureTests()

type ProxyWindow = { TelegramWebviewProxy?: { postEvent: () => void } }

const realOpen = window.open
const realCreate = URL.createObjectURL
const realClick = HTMLAnchorElement.prototype.click
let blobRequests = 0
let urlRequests = 0
let savedBlobs: ReturnType<typeof mock>

beforeEach(() => {
  blobRequests = 0
  urlRequests = 0
  savedBlobs = mock(() => "blob:certificate")
  URL.createObjectURL = savedBlobs as unknown as typeof URL.createObjectURL
  window.open = mock(() => null) as unknown as typeof window.open
  HTMLAnchorElement.prototype.click = () => undefined
  server.use(
    // The mini app path ends in a navigation that happy-dom really performs.
    http.get("https://storage.test/*", () => new HttpResponse("file")),
    http.get(apiUrl("/v1/certificates/files/:fileId/download"), () => {
      blobRequests += 1
      return new HttpResponse("file")
    }),
    http.get(apiUrl("/v1/certificates/files/:fileId/download-url"), () => {
      urlRequests += 1
      return HttpResponse.json({ url: "https://storage.test/certificate.pdf" })
    }),
  )
})

afterEach(() => {
  delete (window as unknown as ProxyWindow).TelegramWebviewProxy
  window.open = realOpen
  URL.createObjectURL = realCreate
  HTMLAnchorElement.prototype.click = realClick
})

async function clickDownload() {
  const { user } = renderSp(<CertificatesSection />)
  await user.click(await screen.findByRole("button", { name: /: ielts\.pdf$/ }))
}

describe("certificate file download", () => {
  test("saves a blob outside the mini app", async () => {
    await clickDownload()

    await waitFor(() => expect(savedBlobs).toHaveBeenCalledTimes(1))
    expect(blobRequests).toBe(1)
    expect(urlRequests).toBe(0)
  })

  test("asks for an address and saves no blob inside the mini app", async () => {
    ;(window as unknown as ProxyWindow).TelegramWebviewProxy = { postEvent: () => undefined }

    await clickDownload()

    await waitFor(() => expect(urlRequests).toBe(1))
    expect(blobRequests).toBe(0)
    expect(savedBlobs).not.toHaveBeenCalled()
  })
})
