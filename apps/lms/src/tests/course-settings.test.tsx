/** LMSUI: course settings (details form, visibility, navigation, link check) and the learner landing page. */
import { beforeEach, describe, expect, it, setDefaultTimeout } from "bun:test"
import { courseSettingsFixture, ids, resetLmsSettings, server, setDropdownValue } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { LandingPage } from "../features/landing/components/landing-page"
import { CourseSettingsPage } from "../features/settings/components/settings-page"
import { accentStyle, contrastRatio, isHexColor, normalizeHex, readableOn } from "../features/settings/utils/color"
import { filterGroups } from "../features/settings/components/group-picker"
import { computeCropRect } from "../features/settings/utils/crop"
import { moveItem, validateSettings } from "../features/settings/utils/validate"
import { CourseCardView, courseCardHref } from "../features/shared/components/course-card-view"
import { authorSession, readBody, renderLms } from "./helpers"

setDefaultTimeout(60_000)
beforeEach(() => resetLmsSettings())

function openSettings() {
  return renderLms(<CourseSettingsPage courseId={ids.course} pollMs={20} />, { session: authorSession })
}

describe("accent colour helpers", () => {
  it("checks and normalises hex colours", () => {
    expect(isHexColor("#2563eb")).toBe(true)
    expect(isHexColor("#25e")).toBe(false)
    expect(normalizeHex("ABC")).toBe("#aabbcc")
  })

  it("picks readable text for light and dark swatches", () => {
    expect(readableOn("#ffffff")).toBe("#111827")
    expect(readableOn("#1e3a8a")).toBe("#ffffff")
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0)
    expect(accentStyle("#ca8a04")).toEqual({ "--course-accent": "#ca8a04", "--course-accent-fg": "#111827" })
    expect(accentStyle("nope")).toBeUndefined()
  })

  it("colours the letter tile of a course card without a picture", () => {
    renderLms(
      <CourseCardView
        course={{
          id: "c",
          slug: "c",
          title: "Zeta",
          description: "Long text",
          summary: "Short summary",
          cover_url: null,
          steps_count: 1,
          progress_pct: null,
          visibility: "public",
          updated_at: null,
          accent_color: "#1e3a8a",
        }}
      />,
    )
    expect(screen.getByText("Short summary")).toBeInTheDocument()
    expect(screen.getByText("Z")).toHaveStyle({ backgroundColor: "#1e3a8a", color: "#ffffff" })
  })
})

describe("settings helpers", () => {
  it("computes a centred crop window and zooms into it", () => {
    expect(computeCropRect(1000, 500, 1)).toEqual({ x: 250, y: 0, w: 500, h: 500 })
    expect(computeCropRect(1000, 500, 5, 2).w).toBe(500)
  })

  it("flags bad hex, long summary, out of range numbers and reversed dates", () => {
    const errors = validateSettings({
      ...courseSettingsFixture,
      accent_color: "blue",
      summary: "x".repeat(201),
      workload_hours_per_week: 41,
      duration_weeks: 0,
      enrolment_starts_at: "2026-10-10T00:00:00Z",
      enrolment_ends_at: "2026-10-01T00:00:00Z",
    })
    expect(Object.keys(errors).toSorted()).toEqual([
      "accent_color",
      "duration_weeks",
      "enrolment_ends_at",
      "summary",
      "workload_hours_per_week",
    ])
  })

  it("moves an item one place and stops at the ends", () => {
    expect(moveItem([1, 2, 3], 1, -1)).toEqual([2, 1, 3])
    expect(moveItem([1, 2, 3], 0, -1)).toEqual([1, 2, 3])
  })
})

describe("settings details", () => {
  it("saves only the changed fields and counts the summary", async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.patch("*/v1/lms/courses/:id/settings/details", async ({ request }) => {
        body = await readBody<Record<string, unknown>>(request)
        return HttpResponse.json({ ...courseSettingsFixture, ...body })
      }),
    )
    const { user } = openSettings()
    const summary = await screen.findByLabelText(/Short summary/)
    await user.clear(summary)
    await user.type(summary, "Hello")
    expect(screen.getByTestId("summary-counter")).toHaveTextContent("5/200")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(body).toEqual({ summary: "Hello" }))
  })

  it("blocks saving with an invalid hex colour and shows the message", async () => {
    const { user } = openSettings()
    const hex = await screen.findByLabelText("Accent color")
    await user.clear(hex)
    await user.type(hex, "#12")
    expect(await screen.findByText("Use a color like #2563eb.")).toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: "#dc2626" }))
    await user.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(screen.getByRole("radio", { name: "#dc2626" })).toHaveAttribute("aria-checked", "true"))
  })

  it("adds a tag chip with Enter", async () => {
    const { user } = openSettings()
    const tags = await screen.findByRole("textbox", { name: /^Tags/ })
    await user.type(tags, "algebra{Enter}")
    expect(within(screen.getByRole("list", { name: /^Tags/ })).getByText("algebra")).toBeInTheDocument()
  })

  it("shows the server's rejection of a field", async () => {
    server.use(
      http.patch("*/v1/lms/courses/:id/settings/details", () =>
        HttpResponse.json(
          { type: "lms/settings-invalid", title: "Invalid", status: 422, params: { field: "code", reason: "taken" } },
          { status: 422, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = openSettings()
    const code = await screen.findByLabelText("Course code")
    await user.type(code, "X")
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText("The server rejected code: taken.")).toBeInTheDocument()
  })
})

describe("settings visibility and navigation", () => {
  it("rejects an enrolment end before its start", async () => {
    const { user } = openSettings()
    await user.click(await screen.findByRole("tab", { name: "Visibility" }))
    setDropdownValue(await screen.findByLabelText("Opens"), "2026-10-10T10:00")
    setDropdownValue(screen.getByLabelText("Closes"), "2026-10-01T10:00")
    expect(await screen.findByText("The end must not be before the start.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
  })

  it("shows the join code and rotates it", async () => {
    const { user } = openSettings()
    await user.click(await screen.findByRole("tab", { name: "Visibility" }))
    expect(await screen.findByText("JOIN1234")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Generate a new code" }))
    expect(await screen.findByText("NEWCODE99")).toBeInTheDocument()
  })

  it("reorders navigation with the arrows and saves the order", async () => {
    let body: { navigation?: { key: string }[] } = {}
    server.use(
      http.patch("*/v1/lms/courses/:id/settings/details", async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json({ ...courseSettingsFixture, ...body })
      }),
    )
    const { user } = openSettings()
    await user.click(await screen.findByRole("tab", { name: "Navigation" }))
    await user.click(await screen.findByRole("button", { name: "Move Syllabus up" }))
    await user.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(body.navigation?.[0]?.key).toBe("syllabus"))
  })
})

describe("link check", () => {
  it("starts, polls until done and lists the broken links", async () => {
    const { user } = openSettings()
    await user.click(await screen.findByRole("button", { name: "Check links" }))

    const list = await screen.findByRole("list", { name: "Broken links" }, { timeout: 10_000 })
    expect(within(list).getByText("https://dead.example/b")).toBeInTheDocument()
    expect(within(list).getByText("Answer 404")).toBeInTheDocument()
    expect(within(list).getByText("No answer in time")).toBeInTheDocument()
    expect(within(list).getByRole("link", { name: "Quiz" }).getAttribute("href")).toContain("/edit/step")
  })
})

describe("landing page", () => {
  it("renders the facts, lists, syllabus, authors and the enrol button", async () => {
    renderLms(<LandingPage slug="calculus-1" preview={false} />)

    expect(await screen.findByText("Limits, derivatives and integrals.")).toBeInTheDocument()
    expect(screen.getByText("Beginner")).toBeInTheDocument()
    expect(screen.getByText("4 h per week")).toBeInTheDocument()
    expect(screen.getByText("10 weeks")).toBeInTheDocument()
    expect(screen.getByText("Differentiate a function")).toBeInTheDocument()
    expect(screen.getByText("Limits")).toBeInTheDocument()
    expect(screen.getByText("Rakhimov Timur")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Enrol" })).toBeEnabled()
    expect(screen.queryByText(/Preview:/)).toBeNull()
  })

  it("shows the preview banner and does not allow enrolling", async () => {
    renderLms(<LandingPage slug="calculus-1" preview />)

    expect(await screen.findByText(/Preview: this is how learners/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Enrol" })).toBeDisabled()
  })
})

describe("course card link", () => {
  it("opens the about page when not enrolled and the course when enrolled", () => {
    expect(courseCardHref({ slug: "algebra", progress_pct: null })).toBe("/course/about/?slug=algebra")
    expect(courseCardHref({ slug: "algebra", progress_pct: 0 })).toBe("/course/?slug=algebra")
  })
})

describe("group picker", () => {
  it("filters groups by name, ignoring case", () => {
    const groups = [{ name: "10-A" }, { name: "11-B" }]
    expect(filterGroups(groups, " 11")).toEqual([{ name: "11-B" }])
    expect(filterGroups(groups, "")).toHaveLength(2)
  })
})
