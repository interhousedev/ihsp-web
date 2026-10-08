/** ADM-1, ID-11, GEN-9: the app frame, the Administration role check and the admin assistant page. */
import { describe, expect, test } from "bun:test"
import { adminTeacherUser, chatAdmin, teacherMe, userMe } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { AdminAssistantPage } from "../features/assistant/components/admin-assistant-page"
import { AdminFrame } from "../features/shell/components/admin-frame"
import { configureTests, hrefOf, renderAdmin } from "./helpers"

configureTests()

describe("app frame", () => {
  test("the sidebar follows the README table: Home, People, Academics, Reports, Communication, Tools", async () => {
    renderAdmin(
      <AdminFrame>
        <p>page body</p>
      </AdminFrame>,
    )

    expect(await screen.findByText("page body")).toBeInTheDocument()
    for (const heading of ["Home", "People", "Academics", "Reports", "Communication", "Tools"]) {
      expect(screen.getAllByText(heading).length).toBeGreaterThan(0)
    }
    const expected: Record<string, string> = {
      Dashboard: "/",
      Students: "/students/",
      Teachers: "/teachers/",
      "Users & roles": "/users/",
      Groups: "/groups/",
      Subjects: "/subjects/",
      Rooms: "/rooms/",
      "Terms & bells": "/terms/",
      Timetable: "/timetable/",
      Lessons: "/lessons/",
      Attendance: "/attendance/",
      Monitoring: "/monitoring/",
      Broadcasts: "/broadcasts/",
      Moderation: "/moderation/",
      Assistant: "/assistant/",
    }
    for (const [name, href] of Object.entries(expected)) {
      const links = screen.getAllByRole("link", { name })
      expect(links.map((link) => hrefOf(link))).toContain(href)
    }
  })

  test("a student account gets the no-access screen", async () => {
    renderAdmin(
      <AdminFrame>
        <p>page body</p>
      </AdminFrame>,
      { session: { user: userMe } },
    )

    expect(await screen.findByText("No access")).toBeInTheDocument()
    expect(screen.queryByText("page body")).not.toBeInTheDocument()
  })

  test("a teacher account gets the no-access screen too", async () => {
    renderAdmin(
      <AdminFrame>
        <p>page body</p>
      </AdminFrame>,
      { session: { user: { ...teacherMe, id: adminTeacherUser.id } } },
    )

    expect(await screen.findByText("No access")).toBeInTheDocument()
  })
})

describe("admin assistant (ADM-15, AI-6)", () => {
  test("lists the chats of the admin assistant", async () => {
    renderAdmin(<AdminAssistantPage />, { route: "/assistant/" })

    expect(await screen.findByRole("heading", { name: "Assistant" })).toBeInTheDocument()
    expect(await screen.findByText(chatAdmin.title)).toBeInTheDocument()
  })
})
