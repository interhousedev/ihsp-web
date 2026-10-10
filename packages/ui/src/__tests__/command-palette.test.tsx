import { describe, expect, it, mock } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { CommandPalette, groupResults, type CommandPaletteResult } from "../components/command-palette"

const results: CommandPaletteResult[] = [
  { id: "n1", title: "Photosynthesis basics", section: "Notebooks", url: "/notebooks/view/?id=n1", icon: "notebooks" },
  { id: "l1", title: "Photosynthesis in leaves", section: "Lessons", url: "/lessons/view/?id=l1", icon: "timetable" },
  { id: "m1", title: "Biology: 5", subtitle: "7 Oct", section: "Marks", url: "/subjects/view/?id=s1", icon: "grades" },
  { id: "b1", title: "Biology textbook", section: "Library", url: "https://library.test/item/?id=b1", icon: "library" },
  { id: "n2", title: "Biology 9", section: "Notebooks", url: "/notebooks/view/?id=n2", icon: "notebooks" },
]

describe("groupResults", () => {
  it("groups by section in order of first appearance", () => {
    expect(groupResults(results).map((group) => [group.section, group.items.length])).toEqual([
      ["Notebooks", 2],
      ["Lessons", 1],
      ["Marks", 1],
      ["Library", 1],
    ])
  })
})

describe("CommandPalette", () => {
  async function openAndType(search: (query: string) => Promise<CommandPaletteResult[]>, onNavigate = mock((_url: string) => {})) {
    const view = renderWithProviders(<CommandPalette search={search} onNavigate={onNavigate} />, {})
    fireEvent.click(await screen.findByRole("button", { name: "Open search" }))
    fireEvent.change(await screen.findByPlaceholderText("Type a command or search…"), { target: { value: "photosyn" } })
    return { onNavigate, ...view }
  }

  it("shows server results under a heading per section, each row with an icon", async () => {
    const search = mock(async (_query: string) => results)
    await openAndType(search)

    await waitFor(() => expect(search).toHaveBeenCalledWith("photosyn"))
    for (const heading of ["Notebooks", "Lessons", "Marks", "Library"]) {
      expect((await screen.findAllByText(heading)).length).toBeGreaterThan(0)
    }
    const row = (await screen.findByText("Photosynthesis basics")).closest("[cmdk-item]") as HTMLElement
    expect(row.querySelector("svg")).not.toBeNull()
    expect(within(row).queryByText("7 Oct")).toBeNull()
    expect(await screen.findByText("7 Oct")).toBeInTheDocument()
  })

  it("opens the deep link of the chosen row", async () => {
    const { onNavigate } = await openAndType(async () => results)

    fireEvent.click(await screen.findByText("Photosynthesis in leaves"))

    expect(onNavigate).toHaveBeenCalledWith("/lessons/view/?id=l1")
  })

  it("finds nothing for a short query and does not call the server", async () => {
    const search = mock(async (_query: string) => results)
    renderWithProviders(<CommandPalette search={search} onNavigate={() => {}} />, {})
    fireEvent.click(await screen.findByRole("button", { name: "Open search" }))

    fireEvent.change(await screen.findByPlaceholderText("Type a command or search…"), { target: { value: "p" } })
    await new Promise((resolve) => setTimeout(resolve, 400))

    expect(search).not.toHaveBeenCalled()
  })
})
