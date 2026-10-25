/** The subject's teacher on its Overview: a pill with the photo or the initials that opens the teacher's page. */
import { describe, expect, test } from "bun:test"
import { ids, persons, subjectDetailPhysics } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { SubjectOverviewTab } from "../features/subjects/components/subject-overview-tab"
import { configureTests, renderSp } from "./helpers"

configureTests()

const PHOTO_URL = "https://files.example.test/photos/kalandarova.jpg"

/** Next.js drops the trailing slash of a static route in tests; the app keeps `/teachers/view/?id=`. */
function normalizeHref(href: string | null): string | null {
  return href?.replace(/([^/])\?/, "$1/?") ?? null
}

describe("subject teacher pill", () => {
  test("shows the initials without a photo and opens the teacher's page", () => {
    renderSp(<SubjectOverviewTab detail={subjectDetailPhysics} />)

    const pill = screen.getByRole("link", { name: "Kalandarova Gavxar" })
    expect(normalizeHref(pill.getAttribute("href"))).toBe(`/teachers/view/?id=${ids.teacherKalandarova}`)
    expect(pill.querySelector("img")).toBeNull()
    expect(pill.querySelector("[data-testid='teacher-avatar']")).toHaveTextContent("KG")
  })

  test("shows the teacher's photo", () => {
    const detail = { ...subjectDetailPhysics, teachers: [{ ...persons.kalandarova, photo_url: PHOTO_URL }] }
    renderSp(<SubjectOverviewTab detail={detail} />)

    const pill = screen.getByRole("link", { name: "Kalandarova Gavxar" })
    expect(pill.querySelector("img")?.getAttribute("src")).toBe(PHOTO_URL)
  })
})
