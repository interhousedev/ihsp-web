/** Student onboarding: the full-screen flow with a required photo and a skippable certificates step. */
import { describe, expect, test } from "bun:test"
import {
  apiUrl,
  certificateEntries,
  onboardingCalls,
  problem,
  server,
  setMyFace,
  setOnboarding,
  setOnboardingEmisEntries,
} from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { OnboardingGate } from "../features/onboarding/components/onboarding-gate"
import { cropRect, fitWithin } from "../features/onboarding/utils/encode-jpeg"
import { configureTests, renderSp } from "./helpers"

configureTests()

const photo = (name: string, type = "image/jpeg") => new File([new Uint8Array(10)], name, { type })

describe("onboarding gate", () => {
  test("a finished student sees nothing", async () => {
    renderSp(<OnboardingGate />)
    await waitFor(() => expect(onboardingCalls().refresh).toBe(0))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  test("a missing photo blocks the app and has no way to skip", async () => {
    setOnboarding({ selfieDone: false, certificatesDone: false })
    renderSp(<OnboardingGate />)

    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveAttribute("aria-modal", "true")
    expect(await screen.findByRole("heading", { name: "Take a selfie" })).toHaveFocus()
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open camera" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /skip|close/i })).not.toBeInTheDocument()
  })

  test("the selfie step tells that the photo is visible to classmates, teachers and administration", async () => {
    setOnboarding({ selfieDone: false, certificatesDone: false })
    renderSp(<OnboardingGate />)

    expect(await screen.findByText(/visible to your classmates, teachers and the administration/)).toBeInTheDocument()
  })

  test("without a camera the file fallback uploads the photo and moves to certificates", async () => {
    setOnboarding({ selfieDone: false, certificatesDone: false })
    const user = userEvent.setup()
    renderSp(<OnboardingGate />)

    await user.click(await screen.findByRole("button", { name: "Open camera" }))
    expect(await screen.findByText(/No camera could be used/)).toBeInTheDocument()

    const input = screen.getByLabelText("Take or choose a photo")
    expect(input).toHaveAttribute("accept", "image/*")
    expect(input).toHaveAttribute("capture", "user")
    await user.upload(input, photo("me.jpg"))
    await user.click(await screen.findByRole("button", { name: "Use this photo" }))

    expect(await screen.findByRole("heading", { name: "Your certificates" })).toBeInTheDocument()
    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument()
  })

  test("the server's upload errors are shown inline and the step stays", async () => {
    setOnboarding({ selfieDone: false })
    server.use(http.put(apiUrl("/v1/me/face"), () => problem(413, "faces/image-too-large", "Too large")))
    const user = userEvent.setup()
    renderSp(<OnboardingGate />)

    await user.upload(await screen.findByLabelText("Take or choose a photo"), photo("me.jpg"))
    await user.click(await screen.findByRole("button", { name: "Use this photo" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("larger than 5 MB")
    expect(screen.getByRole("heading", { name: "Take a selfie" })).toBeInTheDocument()
  })

  test("a file of the wrong type is refused before sending", async () => {
    setOnboarding({ selfieDone: false })
    const user = userEvent.setup({ applyAccept: false })
    renderSp(<OnboardingGate />)

    await user.upload(await screen.findByLabelText("Take or choose a photo"), photo("doc.gif", "image/gif"))
    expect(await screen.findByRole("alert")).toHaveTextContent("Only JPEG or PNG")
  })

  test("certificates: EMIS entries load, and Skip for now calls done", async () => {
    setOnboarding({ certificatesDone: false })
    setOnboardingEmisEntries(certificateEntries)
    const user = userEvent.setup()
    renderSp(<OnboardingGate />)

    expect(await screen.findByRole("heading", { name: "Your certificates" })).toBeInTheDocument()
    expect(await screen.findByText(/Loaded from EMIS: 2 certificates/)).toBeInTheDocument()
    expect(screen.getByText(/used for the school statistics/)).toBeInTheDocument()
    expect(onboardingCalls().refresh).toBe(1)

    await user.click(screen.getByRole("button", { name: "Skip for now" }))
    await waitFor(() => expect(onboardingCalls().done).toBe(1))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  test("certificates: an EMIS error is explained and the step can still be skipped", async () => {
    setOnboarding({ certificatesDone: false })
    server.use(
      http.post(apiUrl("/v1/me/onboarding/certificates/refresh-emis"), () =>
        problem(409, "emis/auth-failed", "EMIS refused"),
      ),
    )
    const user = userEvent.setup()
    renderSp(<OnboardingGate />)

    expect(await screen.findByRole("alert")).toHaveTextContent("EMIS did not accept this login and password.")
    await user.click(screen.getByRole("button", { name: "Done" }))
    await waitFor(() => expect(onboardingCalls().done).toBe(1))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  test("a failed onboarding request lets the app through", async () => {
    server.use(http.get(apiUrl("/v1/me/onboarding"), () => HttpResponse.json({}, { status: 500 })))
    setMyFace({})
    renderSp(<OnboardingGate />)
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  test("the background is inert and the help button hidden while the gate is open", async () => {
    setOnboarding({ selfieDone: false, certificatesDone: false })
    const { container } = renderSp(
      <>
        <nav aria-label="bottom">
          <button type="button">Home</button>
        </nav>
        <div data-help-widget>
          <button type="button">Help: find a feature</button>
        </div>
        <OnboardingGate />
      </>,
    )
    const dialog = await screen.findByRole("dialog")
    await waitFor(() => expect(container.querySelector("nav")?.inert).toBe(true))
    expect(container.querySelector<HTMLElement>("[data-help-widget]")?.style.visibility).toBe("hidden")
    expect(container.querySelector<HTMLElement>("[data-help-widget]")?.inert).toBe(true)
    expect(dialog.inert).toBe(false)
  })

  test("a denied camera drops the permission hint", async () => {
    setOnboarding({ selfieDone: false, certificatesDone: false })
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: async () => {
          throw new DOMException("Permission denied", "NotAllowedError")
        },
      },
      configurable: true,
    })
    const user = userEvent.setup()
    renderSp(<OnboardingGate />)
    expect(await screen.findByText(/will ask for permission/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Open camera" }))
    await screen.findByRole("status")
    expect(screen.queryByText(/will ask for permission/)).not.toBeInTheDocument()
    Reflect.deleteProperty(navigator, "mediaDevices")
  })
})

describe("selfie encoding", () => {
  test("crops to 3:4 around the centre and fits 1080 px", () => {
    expect(cropRect(1280, 720)).toEqual({ x: 370, y: 0, width: 540, height: 720 })
    expect(cropRect(720, 1280)).toEqual({ x: 0, y: 160, width: 720, height: 960 })
    expect(fitWithin(3000, 4000)).toEqual({ width: 810, height: 1080 })
    expect(fitWithin(540, 720)).toEqual({ width: 540, height: 720 })
  })
})
