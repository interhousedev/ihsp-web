import { describe, expect, it } from "bun:test"
import { apiUrl, libSubjects, server, setLibraryActor, userMe } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderLibrary } from "../../test-support"
import { SubjectsPage } from "./subjects-page"

allowSlowRenders()

function renderSubjects() {
  setLibraryActor("librarian")
  return renderLibrary(<SubjectsPage />, {
    route: "/manage/subjects/",
    session: { user: { ...userMe, roles: ["student", "librarian"] } },
  })
}

describe("SubjectsPage", () => {
  it("shows the whole subject tree", async () => {
    renderSubjects()

    const tree = await screen.findByRole("list", { name: "Subject tree" })
    expect(within(tree).getByText("Physics")).toBeInTheDocument()
    expect(within(tree).getByText("Mathematics")).toBeInTheDocument()
  })

  it("archives a subject and restores it", async () => {
    const { user } = renderSubjects()
    await screen.findByRole("list", { name: "Subject tree" })

    await user.click(screen.getByRole("button", { name: "Archive Physics" }))
    expect(await screen.findByText("Archived")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Restore Physics" }))
    await waitFor(() => expect(screen.queryByText("Archived")).not.toBeInTheDocument())
  })

  it("adds a subject under another with its code, sending the parent and the code", async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(
      http.post(apiUrl("/v1/manage/library/subjects"), async ({ request }) => {
        bodies.push((await request.clone().json()) as Record<string, unknown>)
        return HttpResponse.json({}, { status: 201 })
      }),
    )
    const { user } = renderSubjects()
    await screen.findByRole("list", { name: "Subject tree" })

    await user.click(screen.getByRole("button", { name: "Add a subject under Physics" }))
    const dialog = await screen.findByRole("dialog", { name: "Add a subject under this one" })
    expect(within(dialog).getByRole("combobox", { name: "Under" })).toHaveAttribute(
      "data-value",
      libSubjects.physics.id,
    )
    await user.type(within(dialog).getByLabelText("Name (Uzbek)"), "Optika")
    await user.type(within(dialog).getByLabelText("Name (Russian)"), "Оптика")
    await user.type(within(dialog).getByLabelText("Name (English)"), "Optics")
    await user.type(within(dialog).getByLabelText("Code (ББК or УДК)"), "ББК 22.34")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({
      name: { uz: "Optika", ru: "Оптика", en: "Optics" },
      code: "ББК 22.34",
      parent_id: libSubjects.physics.id,
    })
  })

  it("moves a subject down among its siblings", async () => {
    const patches: { id: string; body: Record<string, unknown> }[] = []
    server.use(
      http.patch(apiUrl("/v1/manage/library/subjects/:id"), async ({ params, request }) => {
        patches.push({ id: String(params.id), body: (await request.clone().json()) as Record<string, unknown> })
        return HttpResponse.json({})
      }),
    )
    const { user } = renderSubjects()
    await screen.findByRole("list", { name: "Subject tree" })

    await user.click(screen.getByRole("button", { name: "Move Physics down" }))

    await waitFor(() => expect(patches.length).toBeGreaterThanOrEqual(2))
    expect(patches).toContainEqual({ id: libSubjects.physics.id, body: { position: 1 } })
    expect(patches).toContainEqual({ id: libSubjects.math.id, body: { position: 0 } })
  })
})
