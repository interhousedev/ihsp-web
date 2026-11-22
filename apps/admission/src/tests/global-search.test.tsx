/** Global search: Ctrl+K opens the palette; page results navigate; essay hits link into the editor with a snippet. */
import { describe, expect, test } from "bun:test"
import { fireEvent, screen } from "@testing-library/react"
import { apiUrl, server, testRouter } from "@ihsp/test-utils"
import { http, HttpResponse } from "msw"
import { ShellSearch } from "../features/shell/components/shell-search"
import { renderAdmissionApp } from "./helpers"

function handlers() {
  server.use(
    http.get(apiUrl("/v1/app-map"), () =>
      HttpResponse.json({
        items: [
          {
            id: "admission-essay-ideas",
            app: "admission",
            path: "/essays/?tab=ideas",
            url: null,
            title: { uz: "Insho gʼoyalari", ru: "Идеи для эссе", en: "Essay ideas" },
            keywords: ["brainstorm"],
          },
        ],
      }),
    ),
    http.get(apiUrl("/v1/admission/essays/search"), () =>
      HttpResponse.json({
        items: [
          {
            essay_id: "e1",
            title: "My story",
            field: "body",
            snippet: "…my grandfather lived in Tashkent…",
            match_start: 4,
            match_end: 15,
          },
        ],
      }),
    ),
    http.get(apiUrl("/v1/admission/essays"), () => HttpResponse.json({ items: [] })),
    http.get(apiUrl("/v1/admission/tasks"), () => HttpResponse.json({ items: [] })),
    http.get(apiUrl("/v1/admission/me/items"), () => HttpResponse.json({ items: [] })),
  )
}

describe("global search", () => {
  test("Ctrl+K opens it, a page result navigates", async () => {
    handlers()
    renderAdmissionApp(<ShellSearch nav={[]} />)
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    const input = await screen.findByPlaceholderText(/search/i)
    fireEvent.change(input, { target: { value: "brainstorm" } })
    fireEvent.click(await screen.findByText("Essay ideas"))
    expect(testRouter.push).toHaveBeenCalledWith("/essays/?tab=ideas")
  })

  test("an essay match shows a highlighted snippet and opens the editor at the match", async () => {
    handlers()
    renderAdmissionApp(<ShellSearch nav={[]} />)
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    const input = await screen.findByPlaceholderText(/search/i)
    fireEvent.change(input, { target: { value: "grandfather" } })
    const link = await screen.findByText("My story")
    expect(link.closest("a")?.getAttribute("href")).toBe("/essays/edit/?id=e1&q=grandfather")
    expect((await screen.findByText("grandfather")).tagName).toBe("MARK")
  })
})
