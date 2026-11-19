import { beforeEach, describe, expect, it } from "bun:test"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { apiUrl, server, testRouter, userMe } from "@ihsp/test-utils"
import { http, HttpResponse } from "msw"
import { renderAdmissionApp } from "../../tests/helpers"
import { TourGuide } from "./components/tour-guide"
import { INITIAL_TOUR, TOUR_STOPS, loadTour, tourReducers } from "./tour-state"

const KEY = "admission.tour.v1.test"

const withDismissed = (onboarding_dismissed: string[]) => ({
  session: { user: { ...userMe, preferences: { ...userMe.preferences, onboarding_dismissed } } },
})
/** A student who has not been through the tour yet. */
const fresh = withDismissed([])

beforeEach(() => window.localStorage.clear())

describe("tour state", () => {
  it("walks the stops and ends done", () => {
    let s = tourReducers.start(INITIAL_TOUR)
    expect(s.status).toBe("touring")
    for (let i = 0; i < TOUR_STOPS.length; i++) s = tourReducers.next(s)
    expect(s.status).toBe("done")
  })
  it("collapse keeps the step", () => {
    const s = tourReducers.collapse(tourReducers.next(tourReducers.start(INITIAL_TOUR)))
    expect(s).toMatchObject({ status: "collapsed", step: 1 })
    expect(tourReducers.expand(s)).toMatchObject({ status: "touring", step: 1 })
  })
})

describe("TourGuide", () => {
  it("starts, navigates, collapses, expands and persists", async () => {
    const view = renderAdmissionApp(<TourGuide storageKey={KEY} />, fresh)
    fireEvent.click(await screen.findByRole("button", { name: "Start tour" }))
    fireEvent.click(await screen.findByRole("button", { name: "Next" }))
    expect(testRouter.push).toHaveBeenCalledWith("/career/")
    fireEvent.click(screen.getByRole("button", { name: "Minimise the tour" }))
    expect(screen.queryByRole("region")).toBeNull()
    expect(loadTour(window.localStorage, KEY)).toMatchObject({ status: "collapsed", step: 1 })
    view.unmount()
    renderAdmissionApp(<TourGuide storageKey={KEY} />, fresh)
    fireEvent.click(await screen.findByRole("button", { name: "Continue the tour" }))
    expect(await screen.findByRole("region")).toBeTruthy()
  })

  it("never blocks the page behind it", async () => {
    renderAdmissionApp(<TourGuide storageKey={KEY} />, fresh)
    const root = await screen.findByTestId("tour-root")
    expect(root.className).toContain("pointer-events-none")
    expect(screen.getByRole("region").className).toContain("pointer-events-auto")
  })

  it("resumes at the saved step without navigating", async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ status: "collapsed", step: 3, card: null, dot: null }))
    testRouter.push.mockClear()
    renderAdmissionApp(<TourGuide storageKey={KEY} />, fresh)
    fireEvent.click(await screen.findByRole("button", { name: "Continue the tour" }))
    expect(await screen.findByText("4 of 6")).toBeTruthy()
    expect(testRouter.push).not.toHaveBeenCalled()
    expect(loadTour(window.localStorage, KEY).step).toBe(3)
  })

  it("does not navigate by itself while touring", async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ status: "touring", step: 2, card: null, dot: null }))
    testRouter.push.mockClear()
    renderAdmissionApp(<TourGuide storageKey={KEY} />, fresh)
    await screen.findByRole("button", { name: "Back" })
    await new Promise((r) => setTimeout(r, 50))
    expect(testRouter.push).not.toHaveBeenCalled()
  })

  it("ADM-TOUR-1: a dismissed preference shows no popover on any page", async () => {
    for (const route of ["/", "/career/", "/essays/"]) {
      const view = renderAdmissionApp(<TourGuide storageKey={KEY} />, { ...withDismissed(["tour"]), route })
      await new Promise((r) => setTimeout(r, 30))
      expect(screen.queryByRole("region")).toBeNull()
      expect(screen.queryByTestId("tour-root")).toBeNull()
      view.unmount()
    }
  })

  it("ADM-TOUR-2: Skip hides at once and writes the preference", async () => {
    const bodies: unknown[] = []
    server.use(
      http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
        const body = await request.json()
        bodies.push(body)
        return HttpResponse.json({ ...userMe.preferences, ...(body as object) })
      }),
    )
    renderAdmissionApp(<TourGuide storageKey={KEY} />, fresh)
    fireEvent.click(await screen.findByRole("button", { name: "Skip" }))
    expect(screen.queryByRole("region")).toBeNull()
    await waitFor(() => expect(bodies).toEqual([{ onboarding_dismissed: ["tour"] }]))
    expect(loadTour(window.localStorage, KEY).status).toBe("done")
  })

  it("ADM-TOUR-3: the welcome card starts only on Home", async () => {
    const away = renderAdmissionApp(<TourGuide storageKey={KEY} />, { ...fresh, route: "/career/" })
    await new Promise((r) => setTimeout(r, 30))
    expect(screen.queryByRole("region")).toBeNull()
    away.unmount()
    renderAdmissionApp(<TourGuide storageKey={KEY} />, { ...fresh, route: "/" })
    expect(await screen.findByRole("region")).toBeTruthy()
  })
})
