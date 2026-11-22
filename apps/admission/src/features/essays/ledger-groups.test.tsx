import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { EssaysBody } from "./components/essays-page"

const prompt = (key: string, uni: string, text: string) => ({
  key,
  institution_id: `i-${uni}`,
  institution_name: uni,
  position: 0,
  prompt: text,
  word_limit: 250,
  limit_unit: "words",
  required: true,
  in_list: true,
})
const base = {
  kind: "shared",
  short_answers: [],
  similar_keys: [] as string[],
  spread: 0.2,
  covered: false,
  essay_ids: [] as string[],
  in_list_count: 2,
  due_utc: null,
  due_predicted: false,
}
const fun = {
  ...base,
  key: "fun",
  label: "What do you build for fun?",
  category: "activity" as const,
  similar_keys: ["p-stanford"],
  prompts: [
    prompt("p-mit", "MIT", "What do you do for fun?"),
    prompt("p-kaist", "KAIST", "What do you do for fun?"),
    prompt("p-stanford", "Stanford", "What brings you joy?"),
  ],
}
const why = (uni: string) => ({
  ...base,
  key: `why-${uni}`,
  kind: "unique",
  label: `Why ${uni}?`,
  category: "why_us" as const,
  in_list_count: 1,
  prompts: [prompt(`p-why-${uni}`, uni, `Why ${uni}?`)],
})

describe("two-level essay ledger", () => {
  test("categories hold theme rows with asked-by names, why-us stays one per university", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/essays"), () => HttpResponse.json({ items: [] })),
      http.get(apiUrl("/v1/admission/list"), () => HttpResponse.json([])),
      http.get(apiUrl("/v1/admission/essay-ideas"), () => HttpResponse.json({ items: [] })),
      http.get(apiUrl("/v1/admission/exemplars"), () => HttpResponse.json({ items: [], total: 0 })),
      http.get(apiUrl("/v1/admission/essays/gallery"), () => HttpResponse.json({ items: [], mine: [] })),
      http.get(apiUrl("/v1/admission/essays/practice/today"), () =>
        HttpResponse.json({ day: "2026-11-21", theme: "Place", prompt: "Describe.", entry: null, streak: 0 }),
      ),
      http.get(apiUrl("/v1/admission/essays/match"), () => HttpResponse.json({ items: [] })),
      http.get(apiUrl("/v1/admission/essays/prompt-map"), () =>
        HttpResponse.json({ available: true, model: "m", delta: 0.4, groups: [fun, why("MIT"), why("Stanford")] }),
      ),
    )
    const view = renderAdmissionApp(<EssaysBody />)
    await screen.findByTestId("ledger-rows")
    const activity = screen.getByTestId("ledger-section-activity")
    expect(activity.textContent).toContain("What do you build for fun?")
    expect(screen.getByTestId("ledger-asked-fun").textContent).toBe("Asked by MIT, KAIST · similar: Stanford")
    expect(screen.getByTestId("ledger-write-all-fun").textContent).toContain("Write one for all 3")
    const whyUs = screen.getByTestId("ledger-section-whyUs")
    expect(whyUs.querySelectorAll("li").length).toBe(2)
    expect(screen.queryByTestId("ledger-write-all-why-MIT")).toBeNull()
    await Bun.sleep(300)
    view.unmount()
  })
})
