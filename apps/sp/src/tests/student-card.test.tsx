/** CARD-1: the student-card sheet shows the card. CARD-2 (fake timers) lives in student-card-qr.test.tsx: under Bun 1.3 it hangs when it shares a file with this test. */
import { beforeEach, describe, expect, test } from "bun:test"
import { BRAND } from "@ihsp/config/brand"
import { apiUrl, clientConfig, resetStudentCardTokens, server, studentCardToken } from "@ihsp/test-utils"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { HttpResponse, http } from "msw"
import { act, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import en from "../../messages/en.json"
import cardEn from "../../messages/en/student-card.json"
import { StudentCardSheet } from "../features/student-card/components/student-card-sheet"
import { configureTests, renderSp } from "./helpers"

configureTests()
const messages = mergeMessages(en as Messages, cardEn as Messages)

let tokenRequests = 0
beforeEach(() => {
  tokenRequests = 0
  resetStudentCardTokens()
  server.use(
    http.post(apiUrl("/v1/me/student-card/tokens"), () => {
      tokenRequests += 1
      return HttpResponse.json(studentCardToken(tokenRequests))
    }),
  )
})

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>open card</button>
      <StudentCardSheet open={open} onOpenChange={setOpen} />
    </>
  )
}

describe("CARD-1: the sheet", () => {
  test("shows the card, the lyceum in the locale and hides empty fields", async () => {
    server.use(
      http.get(apiUrl("/v1/me/student-card"), () =>
        HttpResponse.json({
          first_name: "Aleksey",
          last_name: "Brastilov",
          group: "11-A",
          course: 2,
          lyceum_name: { uz: "U", ru: "R", en: "Academic Lyceum" },
          direction: "",
          speciality: "Biology",
          has_photo: false,
        }),
      ),
    )
    renderSp(<Harness />, { messages })
    await act(async () => screen.getByText("open card").click())

    expect(await screen.findByText("Academic Lyceum")).toBeInTheDocument()
    expect(screen.getByText("Biology")).toBeInTheDocument()
    expect(screen.getByText("11-A")).toBeInTheDocument()
    expect(screen.queryByText("Direction")).not.toBeInTheDocument()
  })

  test("uses the logo from the client configuration, else the built-in one", async () => {
    const card = () =>
      http.get(apiUrl("/v1/me/student-card"), () =>
        HttpResponse.json({
          first_name: "A",
          last_name: "B",
          group: "11-A",
          course: 2,
          lyceum_name: null,
          direction: "",
          speciality: "",
          has_photo: false,
        }),
      )
    server.use(
      card(),
      http.get(apiUrl("/v1/public/client-config"), () =>
        HttpResponse.json({
          ...clientConfig,
          branding: { lyceum_logo_url: "/v1/public/lyceum-logo?v=abc123" },
        }),
      ),
    )
    const first = renderSp(<Harness />, { messages })
    await act(async () => screen.getByText("open card").click())
    await waitFor(() =>
      expect(screen.getByTestId("card-lyceum-logo").getAttribute("src")).toEndWith("/v1/public/lyceum-logo?v=abc123"),
    )
    first.unmount()

    server.use(
      card(),
      http.get(apiUrl("/v1/public/client-config"), () => HttpResponse.json(clientConfig)),
    )
    renderSp(<Harness />, { messages })
    await act(async () => screen.getByText("open card").click())
    const logo = await screen.findByTestId("card-lyceum-logo")
    expect(logo.getAttribute("src")).toBe(BRAND.lyceumLogo)
  })
})
