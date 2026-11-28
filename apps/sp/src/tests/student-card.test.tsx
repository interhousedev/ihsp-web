/** CARD-1: the student-card sheet shows the card and the wallet buttons. CARD-2 lives in student-card-qr.test.tsx. */
import { describe, expect, test } from "bun:test"
import { BRAND } from "@ihsp/config/brand"
import { apiUrl, clientConfig, server, studentCard } from "@ihsp/test-utils"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { HttpResponse, http } from "msw"
import { act, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import en from "../../messages/en.json"
import cardEn from "../../messages/en/student-card.json"
import { StudentCardSheet } from "../features/student-card/components/student-card-sheet"
import type { WalletPlatform } from "../features/student-card/utils/wallet-platform"
import { walletPlatform } from "../features/student-card/utils/wallet-platform"
import { configureTests, renderSp } from "./helpers"

configureTests()
const messages = mergeMessages(en as Messages, cardEn as Messages)

function Harness({ platform }: { platform?: WalletPlatform }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>open card</button>
      <StudentCardSheet open={open} onOpenChange={setOpen} walletPlatform={platform} />
    </>
  )
}

async function openCard(platform?: WalletPlatform) {
  const view = renderSp(<Harness platform={platform} />, { messages })
  await act(async () => screen.getByText("open card").click())
  await screen.findByTestId("student-id-card")
  return view
}

describe("CARD-1: the sheet", () => {
  test("shows the lyceum, full name, year, group, student ID and speciality; hides empty fields", async () => {
    server.use(
      http.get(apiUrl("/v1/me/student-card"), () =>
        HttpResponse.json(studentCard({ speciality: "", has_photo: false })),
      ),
    )
    await openCard()

    expect(screen.getByText("Academic Lyceum International House Tashkent")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Brastilov Aleksey Igorevich" })).toBeInTheDocument()
    expect(screen.getByText("2026-2027")).toBeInTheDocument()
    expect(screen.getByText("11-A")).toBeInTheDocument()
    expect(screen.getAllByText("ST-2026-0007")).toHaveLength(2)
    expect(screen.queryByText("Specialization")).not.toBeInTheDocument()
    expect(screen.getByTestId("person-silhouette")).toBeInTheDocument()
  })

  test("uses the logo from the client configuration, else the built-in one", async () => {
    server.use(
      http.get(apiUrl("/v1/public/client-config"), () =>
        HttpResponse.json({ ...clientConfig, branding: { lyceum_logo_url: "/v1/public/lyceum-logo?v=abc123" } }),
      ),
    )
    const first = await openCard()
    await waitFor(() =>
      expect(screen.getByTestId("card-lyceum-logo").getAttribute("src")).toEndWith("/v1/public/lyceum-logo?v=abc123"),
    )
    first.unmount()

    server.use(http.get(apiUrl("/v1/public/client-config"), () => HttpResponse.json(clientConfig)))
    await openCard()
    expect(screen.getByTestId("card-lyceum-logo").getAttribute("src")).toBe(BRAND.lyceumLogo)
  })
})

describe("CARD-3: wallet buttons", () => {
  test("an Apple device gets only Apple Wallet, Android only Google Wallet, others both", async () => {
    const apple = await openCard("apple")
    expect(screen.getByRole("button", { name: "Add to Apple Wallet" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add to Google Wallet" })).not.toBeInTheDocument()
    apple.unmount()

    const android = await openCard("android")
    expect(screen.getByRole("button", { name: "Add to Google Wallet" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add to Apple Wallet" })).not.toBeInTheDocument()
    android.unmount()

    await openCard("other")
    expect(screen.getByRole("button", { name: "Add to Apple Wallet" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add to Google Wallet" })).toBeInTheDocument()
  })

  test("a wallet that is off is hidden", async () => {
    server.use(
      http.get(apiUrl("/v1/me/student-card"), () =>
        HttpResponse.json(studentCard({ wallet: { apple: false, google: true } })),
      ),
    )
    await openCard("other")
    expect(screen.queryByRole("button", { name: "Add to Apple Wallet" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add to Google Wallet" })).toBeInTheDocument()
  })

  test("Google Wallet opens the link from the server", async () => {
    const opened: string[] = []
    const original = window.open
    window.open = ((url: string) => {
      opened.push(url)
      return {} as Window
    }) as typeof window.open
    try {
      await openCard("android")
      await act(async () => screen.getByRole("button", { name: "Add to Google Wallet" }).click())
      await waitFor(() => expect(opened).toEqual(["https://pay.google.com/gp/v/save/test-jwt"]))
    } finally {
      window.open = original
    }
  })

  test("the device detection", () => {
    expect(walletPlatform({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" })).toBe("apple")
    expect(walletPlatform({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0)" })).toBe("apple")
    expect(walletPlatform({ userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9)" })).toBe("android")
    expect(walletPlatform({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", platform: "Win32" })).toBe("other")
  })
})
