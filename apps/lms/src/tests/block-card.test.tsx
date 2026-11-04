import { describe, expect, it } from "bun:test"
import { screen } from "@testing-library/react"
import { BlockCard } from "../features/step-editor/components/block-card"
import { renderLms } from "./helpers"

describe("step editor: block controls follow the editing permission (UF-LMS-08)", () => {
  it("hides the move and delete controls from a user who cannot edit the step", () => {
    renderLms(
      <BlockCard type="text" index={1} total={3} canEdit={false} onMove={() => undefined} onRemove={() => undefined}>
        <p>Read only body</p>
      </BlockCard>,
    )

    expect(screen.queryAllByRole("button")).toHaveLength(0)
    expect(screen.getByText("Read only body")).toBeInTheDocument()
  })

  it("shows move up, move down and delete to a user who can edit the step", () => {
    renderLms(
      <BlockCard type="text" index={1} total={3} canEdit onMove={() => undefined} onRemove={() => undefined}>
        <p>Editable body</p>
      </BlockCard>,
    )

    expect(screen.getAllByRole("button")).toHaveLength(3)
  })
})
