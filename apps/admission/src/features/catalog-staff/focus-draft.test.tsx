import { describe, expect, test } from "bun:test"
import { fireEvent, screen } from "@testing-library/react"
import { useState } from "react"
import { renderAdmissionApp } from "../../tests/helpers"
import { FactField } from "./components/fact-field"
import { draftFromValue, serializeDraft, type Draft } from "./fact-draft"
import type { FactSpecItem } from "./api"

const ITEM = { key: "focuses", kind: "focuses", label: "Focuses" } as unknown as FactSpecItem
const VALUE = [
  {
    text: { en: "Making", ru: "Создание", uz: "Yaratish" },
    quote: "We value building.",
    source_url: "https://mit.edu/a",
    fetched_at: "2026-01-02",
    verified: true,
  },
]

describe("focuses editor", () => {
  test("round-trips a stored value", () => {
    expect(serializeDraft(ITEM, draftFromValue(ITEM, VALUE))).toEqual(VALUE)
  })

  test("drops incomplete rows", () => {
    const draft = draftFromValue(ITEM, [{ ...VALUE[0], source_url: "http://x.edu" }])
    expect(serializeDraft(ITEM, draft)).toBeUndefined()
  })

  test("adds an item through the form and serializes it", () => {
    let latest: Draft | undefined
    function Host() {
      const [draft, setDraft] = useState<Draft>([])
      latest = draft
      return <FactField item={ITEM} draft={draft} onChange={setDraft} />
    }
    renderAdmissionApp(<Host />)
    fireEvent.click(screen.getByRole("button", { name: /Add focus/ }))
    const type = (name: RegExp | string, value: string) =>
      fireEvent.change(screen.getByLabelText(name), { target: { value } })
    type("Focus (en)", "Making")
    type("Focus (ru)", "Создание")
    type("Focus (uz)", "Yaratish")
    type(/Exact quote/, "We value building.")
    type(/Page on the university site/, "https://mit.edu/a")
    type(/Fetched on/, "2026-01-02")
    fireEvent.click(screen.getByRole("button", { name: "Verified" }))
    expect(serializeDraft(ITEM, latest)).toEqual(VALUE)
  })
})
