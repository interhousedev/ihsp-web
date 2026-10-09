import { describe, expect, it } from "bun:test"
import { libSubjects, setLibraryActor, userMe } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { allowSlowRenders, renderLibrary } from "../../test-support"
import { TopicsPage } from "./topics-page"

allowSlowRenders()

async function renderTopics() {
  setLibraryActor("librarian")
  const view = renderLibrary(<TopicsPage />, {
    route: "/manage/topics/",
    session: { user: { ...userMe, roles: ["student", "librarian"] } },
  })
  const select = await screen.findByLabelText("Subject")
  await waitFor(() => expect(within(select).getAllByRole("option").length).toBeGreaterThan(1))
  await view.user.selectOptions(select, libSubjects.physics.id)
  return view
}

describe("TopicsPage", () => {
  it("shows the topic tree of the chosen subject with children nested", async () => {
    await renderTopics()

    const tree = await screen.findByRole("list", { name: "Topics of Physics" })
    expect(within(tree).getByText("Mechanics")).toBeInTheDocument()
    expect(within(tree).getByText("Thermodynamics")).toBeInTheDocument()
    const mechanics = within(tree).getByText("Mechanics").closest("li") as HTMLElement
    expect(within(mechanics).getByText("Kinematics")).toBeInTheDocument()
    expect(within(tree).queryByText("Algebra")).not.toBeInTheDocument()
  })

  it("needs the name in all three languages, then adds the topic", async () => {
    const { user } = await renderTopics()
    await screen.findByRole("list", { name: "Topics of Physics" })

    await user.click(screen.getAllByRole("button", { name: "Add topic" })[0]!)
    const dialog = await screen.findByRole("dialog", { name: "Add topic" })
    await user.type(within(dialog).getByLabelText("Name (English)"), "Optics")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect((await within(dialog).findAllByText("This field is required.")).length).toBe(2)

    await user.type(within(dialog).getByLabelText("Name (Uzbek)"), "Optika")
    await user.type(within(dialog).getByLabelText("Name (Russian)"), "Оптика")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(await screen.findByText("Optics")).toBeInTheDocument()
  })

  it("adds a subtopic under a topic and edits a name", async () => {
    const { user } = await renderTopics()
    await screen.findByRole("list", { name: "Topics of Physics" })

    await user.click(screen.getByRole("button", { name: "Add a topic under Thermodynamics" }))
    const add = await screen.findByRole("dialog", { name: "Add subtopic" })
    expect(within(add).getByText("It will be placed under “Thermodynamics”.")).toBeInTheDocument()
    await user.type(within(add).getByLabelText("Name (Uzbek)"), "Issiqlik")
    await user.type(within(add).getByLabelText("Name (Russian)"), "Тепло")
    await user.type(within(add).getByLabelText("Name (English)"), "Heat")
    await user.click(within(add).getByRole("button", { name: "Save" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    const thermo = (await screen.findByText("Heat")).closest("ul")
    expect(thermo).not.toBeNull()

    await user.click(screen.getByRole("button", { name: "Edit Heat" }))
    const edit = await screen.findByRole("dialog", { name: "Edit topic" })
    const english = within(edit).getByLabelText("Name (English)")
    await user.clear(english)
    await user.type(english, "Heat transfer")
    await user.click(within(edit).getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Heat transfer")).toBeInTheDocument()
  })

  it("deletes a topic after a confirmation that names the children it takes with it", async () => {
    const { user } = await renderTopics()
    await screen.findByRole("list", { name: "Topics of Physics" })

    await user.click(screen.getByRole("button", { name: "Delete Mechanics" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText(/and all the topics below it will be deleted/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(screen.queryByText("Mechanics")).not.toBeInTheDocument())
    expect(screen.queryByText("Kinematics")).not.toBeInTheDocument()
    expect(screen.getByText("Thermodynamics")).toBeInTheDocument()
  })
})
