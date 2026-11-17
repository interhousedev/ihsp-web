import { beforeEach, describe, expect, it } from "bun:test"
import { fireEvent, screen } from "@testing-library/react"
import { testRouter } from "@ihsp/test-utils"
import { renderAdmissionApp } from "../../tests/helpers"
import { TourGuide } from "./components/tour-guide"
import { INITIAL_TOUR, TOUR_STOPS, loadTour, tourReducers } from "./tour-state"

const KEY = "admission.tour.v1.test"

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
    const view = renderAdmissionApp(<TourGuide storageKey={KEY} />)
    fireEvent.click(await screen.findByRole("button", { name: "Start tour" }))
    fireEvent.click(await screen.findByRole("button", { name: "Next" }))
    expect(testRouter.push).toHaveBeenCalledWith("/journey/")
    fireEvent.click(screen.getByRole("button", { name: "Minimise the tour" }))
    expect(screen.queryByRole("region")).toBeNull()
    expect(loadTour(window.localStorage, KEY)).toMatchObject({ status: "collapsed", step: 1 })
    view.unmount()
    renderAdmissionApp(<TourGuide storageKey={KEY} />)
    fireEvent.click(await screen.findByRole("button", { name: "Continue the tour" }))
    expect(await screen.findByRole("region")).toBeTruthy()
  })

  it("never blocks the page behind it", async () => {
    renderAdmissionApp(<TourGuide storageKey={KEY} />)
    const root = await screen.findByTestId("tour-root")
    expect(root.className).toContain("pointer-events-none")
    expect(screen.getByRole("region").className).toContain("pointer-events-auto")
  })

  it("resumes at the saved step without navigating", async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ status: "collapsed", step: 3, card: null, dot: null }))
    testRouter.push.mockClear()
    renderAdmissionApp(<TourGuide storageKey={KEY} />)
    fireEvent.click(await screen.findByRole("button", { name: "Continue the tour" }))
    expect(await screen.findByText("4 of 7")).toBeTruthy()
    expect(testRouter.push).not.toHaveBeenCalled()
    expect(loadTour(window.localStorage, KEY).step).toBe(3)
  })

  it("does not navigate by itself while touring", async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ status: "touring", step: 2, card: null, dot: null }))
    testRouter.push.mockClear()
    renderAdmissionApp(<TourGuide storageKey={KEY} />)
    await screen.findByRole("button", { name: "Back" })
    await new Promise((r) => setTimeout(r, 50))
    expect(testRouter.push).not.toHaveBeenCalled()
  })
})
