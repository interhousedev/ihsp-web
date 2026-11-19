import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { MotionGlobalConfig } from "motion/react"
import { renderAdmissionApp } from "../../tests/helpers"
import { CollegesCarousel, NewHere } from "./components/home-widgets"
import { ContinueAction, JourneySection, SECTIONS, SectionCards } from "./components/home-sections"

MotionGlobalConfig.skipAnimations = true

function serve() {
  server.use(
    http.get(apiUrl("/v1/admission/readiness"), () =>
      HttpResponse.json({
        percent: 10,
        components: [
          { key: "major", score: 100, weight: 10, next_action: null, url_path: null },
          { key: "essays", score: 50, weight: 20, next_action: "write_essay", url_path: "/essays/" },
        ],
      }),
    ),
    http.get(apiUrl("/v1/admission/career"), () =>
      HttpResponse.json({ study_focus: { field_ids: ["f"], labels: ["Biology"] } }),
    ),
    http.get(apiUrl("/v1/admission/me/items"), () => HttpResponse.json({ items: [], next_cursor: null })),
    http.get(apiUrl("/v1/admission/list"), () => HttpResponse.json([])),
    http.get(apiUrl("/v1/admission/matches"), () => HttpResponse.json({ items: [], next_cursor: null })),
    http.get(apiUrl("/v1/admission/preferences"), () => HttpResponse.json({})),
  )
}

describe("home sections", () => {
  test("five section cards link to the landing pages", async () => {
    serve()
    renderAdmissionApp(<SectionCards />)
    const links = await screen.findAllByRole("link")
    expect(links.map((l) => l.getAttribute("href"))).toEqual(SECTIONS.map((s) => s.href.replace(/\/$/, "")))
    expect(links).toHaveLength(5)
    expect(await screen.findByText(/Biology/)).toBeTruthy()
  })

  test("continue links to the first incomplete readiness action", async () => {
    serve()
    renderAdmissionApp(<ContinueAction />)
    await waitFor(() => expect(screen.getByRole("link", { name: /Continue/ }).getAttribute("href")).toBe("/essays"))
  })

  test("the journey section has the anchor id", async () => {
    serve()
    const { container } = renderAdmissionApp(<JourneySection />)
    expect(container.querySelector("section#journey")).toBeTruthy()
  })

  test("discover and journey links point at the new routes", async () => {
    serve()
    server.use(
      http.get(apiUrl("/v1/admission/readiness"), () =>
        HttpResponse.json({
          percent: 0,
          components: [{ key: "major", score: 0, weight: 10, next_action: null, url_path: null }],
        }),
      ),
      http.get(apiUrl("/v1/admission/preferences"), () => HttpResponse.json({ completed: false })),
    )
    renderAdmissionApp(
      <>
        <CollegesCarousel />
        <NewHere />
      </>,
    )
    await waitFor(() => expect(screen.getAllByRole("link").map((l) => l.getAttribute("href"))).toContain("/#journey"))
    const hrefs = screen.getAllByRole("link").map((l) => l.getAttribute("href"))
    expect(hrefs).toContain("/chooser/search?view=discover")
    expect(hrefs.some((h) => h?.startsWith("/colleges"))).toBe(false)
  })
})
