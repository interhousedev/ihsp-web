/** Admin: "From lessons (EMIS)" of a subject: the list, the group filter, paging and the hidden badge. */
import { describe, expect, test } from "bun:test"
import type { LessonSourceItem, LessonSourcePage } from "@ihsp/api"
import { apiUrl, ids, lessonSources, lessonSourcesSubjectId, selectDropdownOption, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { LessonSources } from "../features/subjects/components/lesson-sources"
import { SubjectsPage } from "../features/subjects/components/subjects-page"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

describe("admin lesson sources", () => {
  test("lists the EMIS materials with a link to open and the file size", async () => {
    renderAdmin(<LessonSources subjectId={lessonSourcesSubjectId} />)

    const list = await screen.findByRole("list", { name: "From lessons (EMIS)" })
    expect(within(list).getAllByRole("listitem")).toHaveLength(4)
    expect(within(list).getByText("06.10 Derivatives slides")).toBeInTheDocument()
    expect(within(list).getByText("kinematics-notes.pdf (470.8 KB)")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open 06.10 Derivatives slides" })).toHaveAttribute(
      "href",
      "https://iht.uz/s/lesson1",
    )
  })

  test("marks hidden materials", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/subjects/:subjectId/lesson-sources"), () => {
        const item: LessonSourceItem = { ...(lessonSources[1] as LessonSourceItem), hidden: true }
        const page: LessonSourcePage = { items: [item], total: 1, limit: 20, offset: 0 }
        return HttpResponse.json(page)
      }),
    )
    renderAdmin(<LessonSources subjectId={lessonSourcesSubjectId} />)

    expect(await screen.findByText("Hidden")).toBeInTheDocument()
  })

  test("the group filter asks for one group", async () => {
    const asked: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/admin/subjects/:subjectId/lesson-sources"), ({ request }) => {
        const groupId = new URL(request.url).searchParams.get("group_id")
        asked.push(groupId)
        const items = lessonSources.filter((item) => item.source === "emis" && (!groupId || item.group_id === groupId))
        return HttpResponse.json({ items, total: items.length, limit: 20, offset: 0 })
      }),
    )
    const { user } = renderAdmin(<LessonSources subjectId={lessonSourcesSubjectId} />)
    await screen.findByText("06.10 Derivatives slides")

    await selectDropdownOption(user, screen.getByRole("combobox", { name: "Group" }), "1TN1")

    expect(await screen.findByText("02.10 Quadratics video")).toBeInTheDocument()
    expect(screen.queryByText("06.10 Derivatives slides")).not.toBeInTheDocument()
    expect(asked.at(-1)).toBe(ids.group1TN1)
  })

  test("pages with limit and offset", async () => {
    const offsets: number[] = []
    const many = Array.from({ length: 45 }, (_, n) => ({
      ...(lessonSources[1] as LessonSourceItem),
      link_id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
      title: `Material ${n}`,
    }))
    server.use(
      http.get(apiUrl("/v1/admin/subjects/:subjectId/lesson-sources"), ({ request }) => {
        const search = new URL(request.url).searchParams
        const limit = Number(search.get("limit"))
        const offset = Number(search.get("offset"))
        offsets.push(offset)
        return HttpResponse.json({ items: many.slice(offset, offset + limit), total: 45, limit, offset })
      }),
    )
    const { user } = renderAdmin(<LessonSources subjectId={lessonSourcesSubjectId} />)
    expect(await screen.findByText("1–20 of 45")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(await screen.findByText("21–40 of 45")).toBeInTheDocument()
    expect(screen.getByText("Material 20")).toBeInTheDocument()
    expect(offsets).toEqual([0, 20])
  })

  test("the subjects page opens the lessons of a subject in a dialog", async () => {
    const { user } = renderAdmin(<SubjectsPage />, { route: "/subjects/" })

    await user.click(await screen.findByRole("button", { name: "Lesson materials of Mathematics" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("From lessons (EMIS): Mathematics")).toBeInTheDocument()
    expect(await within(dialog).findByText("06.10 Derivatives slides")).toBeInTheDocument()
  })
})
