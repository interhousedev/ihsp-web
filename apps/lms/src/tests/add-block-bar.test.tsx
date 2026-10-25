import { describe, expect, it } from "bun:test"
import type { Block } from "@ihsp/api"
import { fireEvent, screen } from "@testing-library/react"
import { AddBlockBar } from "../features/step-editor/components/add-block-bar"
import { renderLms } from "./helpers"

describe("add block picker", () => {
  it.each([
    ["h5p", "h5p"],
    ["interactive_video", "interactive_video"],
  ] as const)("the %s menu item creates a %s block", (id, type) => {
    const added: Block[] = []
    renderLms(<AddBlockBar onAdd={(block) => added.push(block)} />)
    fireEvent.click(screen.getByRole("button", { name: "Add block" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.click(dialog.querySelector(`[data-step-type="${id}"]`) as HTMLElement)
    expect(added).toHaveLength(1)
    expect(added[0]?.type).toBe(type)
  })
})
