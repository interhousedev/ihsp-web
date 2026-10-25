/** Staff: "From lessons (EMIS)" of a subject: the list, the group filter, hide and show, and the group switch. */
import { describe, expect, test } from "bun:test"
import type { StaffSubject } from "@ihsp/api"
import { apiUrl, ids, lessonSourceIds, selectDropdownOption, server, staffSubjects } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { SubjectLessonSources } from "../features/subjects/components/subject-lesson-sources"
import { configureTests, renderStaff } from "./helpers"

configureTests()

const MATH = staffSubjects.find((item) => item.subject_id === ids.math) as StaffSubject

describe("staff lesson sources", () => {
  test("lists the materials of the lessons with their group and file size", async () => {
    renderStaff(<SubjectLessonSources subject={MATH} />)

    const list = await screen.findByRole("list", { name: "From lessons (EMIS)" })
    expect(within(list).getAllByRole("listitem")).toHaveLength(4)
    expect(within(list).getByText("kinematics-notes.pdf (470.8 KB)")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open 06.10 Derivatives slides" })).toHaveAttribute(
      "href",
      "https://iht.uz/s/lesson1",
    )
  })

  test("the group filter asks for one group", async () => {
    const asked: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/staff/subjects/:subjectId/lesson-sources"), ({ request }) => {
        asked.push(new URL(request.url).searchParams.get("group_id"))
        return HttpResponse.json({ items: [], total: 0, limit: 20, offset: 0 })
      }),
    )
    const { user } = renderStaff(<SubjectLessonSources subject={MATH} />)
    await screen.findByText("No lesson materials.")

    await selectDropdownOption(user, screen.getByRole("combobox", { name: "Group" }), "2TN2")

    await waitFor(() => expect(asked.at(-1)).toBe(ids.group2TN2))
  })

  test("hiding a material posts hidden=true for its lesson and shows the badge, then it can be shown again", async () => {
    const posted: { path: string; hidden: boolean }[] = []
    server.events.on("request:start", async ({ request }) => {
      if (request.method === "POST" && request.url.includes("/hide")) {
        posted.push({ path: new URL(request.url).pathname, hidden: (await request.clone().json()).hidden })
      }
    })
    const { user } = renderStaff(<SubjectLessonSources subject={MATH} />)

    await user.click(await screen.findByRole("button", { name: "Hide 06.10 Derivatives slides" }))

    expect(await screen.findByText("Hidden")).toBeInTheDocument()
    expect(posted[0]?.hidden).toBe(true)
    expect(posted[0]?.path).toEndWith(`/resources/${lessonSourceIds.emisUrl}/hide`)

    await user.click(await screen.findByRole("button", { name: "Show 06.10 Derivatives slides" }))

    await waitFor(() => expect(screen.queryByText("Hidden")).not.toBeInTheDocument())
    expect(posted[1]?.hidden).toBe(false)
    server.events.removeAllListeners()
  })

  test("the group switch puts hidden=true and the list shows the materials hidden by the rule", async () => {
    const puts: boolean[] = []
    server.events.on("request:start", async ({ request }) => {
      if (request.method === "PUT" && request.url.includes("/emis-sources-hidden")) {
        puts.push((await request.clone().json()).hidden)
      }
    })
    const { user } = renderStaff(<SubjectLessonSources subject={MATH} />)
    const toggle = await screen.findByRole("switch", { name: "Hide EMIS sources for 2TN2" })
    await waitFor(() => expect(toggle).toBeEnabled())

    await user.click(toggle)

    await waitFor(() => expect(puts).toEqual([true]))
    await waitFor(() => expect(screen.getAllByText("Hidden by the group rule").length).toBe(3))
    expect(screen.getByRole("switch", { name: "Hide EMIS sources for 2TN2" })).toBeChecked()
    server.events.removeAllListeners()
  })
})
