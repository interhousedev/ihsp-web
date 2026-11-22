import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../../../tests/helpers"
import { PeekNote, clampPoint } from "./peek-note"

const A = "/v1/admission"
const summary = (id: string, title: string) => ({
  id,
  kind: "other",
  title,
  prompt_text: "",
  word_limit: null,
  list_entry_id: null,
  word_count: 3,
  status: "draft",
  current_version: 0,
  lock_version: 1,
  forked_from: null,
  targets: [],
  updated_at: "2026-01-01T00:00:00Z",
  uniqueness: null,
  deep_read: "none",
  deep_read_at: null,
  unreadable: false,
})

describe("peek note", () => {
  test("opens, shows the chosen essay read-only and closes", async () => {
    server.use(
      http.get(apiUrl(`${A}/essays`), () =>
        HttpResponse.json({ items: [summary("cur", "Current"), summary("e2", "Robot club")] }),
      ),
      http.get(apiUrl(`${A}/essays/e2`), () =>
        HttpResponse.json({
          ...summary("e2", "Robot club"),
          prompt_text: "What do you build for fun?",
          body: "I build robots",
          notes: "",
          plan: [],
          links: [],
        }),
      ),
    )
    let open = true
    const view = renderAdmissionApp(<PeekNote open={open} onClose={() => (open = false)} currentId="cur" />)
    const select = (await screen.findByLabelText("Choose an essay")) as HTMLSelectElement
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual(["Choose an essay", "Robot club"])
    fireEvent.change(select, { target: { value: "e2" } })
    expect((await screen.findByTestId("peek-text")).textContent).toBe("I build robots")
    expect(screen.getByTestId("peek-essay").textContent).toContain("What do you build for fun?")
    expect(screen.getByTestId("peek-note").style.position).toBe("fixed")
    expect(screen.queryByRole("textbox")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Close the note" }))
    expect(open).toBe(false)
    view.rerender(<PeekNote open={open} onClose={() => undefined} currentId="cur" />)
    expect(screen.queryByTestId("peek-note")).toBeNull()
  })

  test("the position stays inside the viewport", () => {
    expect(clampPoint({ x: -50, y: 9999 }, 360, 420, 1000, 800)).toEqual({ x: 8, y: 372 })
  })
})
