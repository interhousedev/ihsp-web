/** The college picker: debounced search, keyboard selection, the add-a-university row, and the inline add in my list. */
import { describe, expect, it } from "bun:test"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { InstitutionCombobox } from "../features/chooser/components/institution-combobox"
import { UniListStage } from "../features/chooser/components/list-stage"
import { institution, mockChooser } from "./chooser-handlers"
import { renderAdmissionApp } from "./helpers"

describe("institution combobox", () => {
  it("searches by text and selects with the keyboard", async () => {
    const { catalogRequests } = mockChooser({ items: [institution()] })
    const picked: (string | null)[] = []
    renderAdmissionApp(<InstitutionCombobox value={null} onChange={(item) => picked.push(item?.id ?? null)} />)
    const input = screen.getByRole("combobox")
    fireEvent.change(input, { target: { value: "uni" } })
    await screen.findByText("Uni One")
    await waitFor(() => expect(catalogRequests.some((url) => url.searchParams.get("q") === "uni")).toBe(true))
    fireEvent.keyDown(input, { key: "ArrowDown" })
    fireEvent.keyDown(input, { key: "Enter" })
    await waitFor(() => expect(picked.length).toBe(1))
  })

  it("offers the add-a-university row with the typed query", async () => {
    mockChooser({ items: [] })
    const added: string[] = []
    renderAdmissionApp(
      <InstitutionCombobox value={null} onChange={() => {}} onAddSchool={(query) => added.push(query)} />,
    )
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "xyz" } })
    const row = await screen.findByText(/Add .*xyz|Add a university/)
    fireEvent.mouseDown(row)
    await waitFor(() => expect(added).toEqual(["xyz"]))
  })
})

describe("my list add row", () => {
  it("opens the picker and posts the chosen university", async () => {
    const { listPosts } = mockChooser({ items: [institution()], list: [] })
    renderAdmissionApp(<UniListStage />)
    fireEvent.click(await screen.findByRole("button", { name: /Add a university/ }))
    const input = await screen.findByRole("combobox")
    fireEvent.change(input, { target: { value: "uni" } })
    fireEvent.mouseDown(await screen.findByText("Uni One"))
    await waitFor(() => expect(listPosts).toEqual([{ institution_id: "i1" }]))
  })
})
