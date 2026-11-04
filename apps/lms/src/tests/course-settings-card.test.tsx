import { describe, expect, it } from "bun:test"
import { courseDraft } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { CourseSettingsCard } from "../features/editor/components/course-settings-card"
import { renderLms } from "./helpers"

describe("course editor: visibility is edited in one place, course settings (CRS-SET)", () => {
  it("shows visibility and status as read-only text with a link to course settings", () => {
    renderLms(<CourseSettingsCard draft={{ ...courseDraft, visibility: "invite" }} />)

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(screen.getByText("Invite only")).toBeInTheDocument()
    const link = screen.getByRole("link", { name: "Open course settings" })
    expect(link.getAttribute("href")).toContain("/edit/settings")
  })
})
