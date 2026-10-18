/** The file picker of the lesson attachment dialog: name search, type filter, order and six per page. */
import { describe, expect, test } from "bun:test"
import { apiUrl, filePdf, selectDropdownValue, server } from "@ihsp/test-utils"
import { FilePicker } from "@ihsp/features-core"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { configureTests, renderSp, setValue } from "./helpers"

configureTests()

function manyFiles(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    ...filePdf,
    id: `00000000-0000-4000-8000-0000000001${String(index).padStart(2, "0")}`,
    name: `file-${index}.pdf`,
    created_at: `2026-10-0${(index % 9) + 1}T05:12:00Z`,
  }))
}

describe("file picker", () => {
  test("asks for six files per page and pages with Next and Previous", async () => {
    const seen: string[] = []
    const files = manyFiles(8)
    server.use(
      http.get(apiUrl("/v1/me/files"), ({ request }) => {
        const search = new URL(request.url).searchParams
        seen.push(`${search.get("page")}/${search.get("page_size")}/${search.get("sort")}`)
        const page = Number(search.get("page"))
        return HttpResponse.json({
          items: files.slice((page - 1) * 6, page * 6),
          next_cursor: page * 6 < files.length ? String(page + 1) : null,
        })
      }),
    )
    const { user } = renderSp(<FilePicker onPick={() => undefined} />)

    await screen.findByText("file-0.pdf")
    expect(screen.getAllByRole("button", { name: /file-/ })).toHaveLength(6)
    await user.click(screen.getByRole("button", { name: "Next" }))

    await screen.findByText("file-6.pdf")
    expect(screen.getAllByRole("button", { name: /file-/ })).toHaveLength(2)
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled()
    expect(seen).toContain("2/6/recent")
  })

  test("name, type and order go to the server and reset to the first page", async () => {
    const requests: Record<string, string | null>[] = []
    server.use(
      http.get(apiUrl("/v1/me/files"), ({ request }) => {
        const search = new URL(request.url).searchParams
        requests.push({
          q: search.get("q"),
          type: search.get("type"),
          sort: search.get("sort"),
          page: search.get("page"),
        })
        return HttpResponse.json({ items: [filePdf], next_cursor: null })
      }),
    )
    const { user } = renderSp(<FilePicker onPick={() => undefined} />)
    await screen.findByText(filePdf.name)

    setValue(screen.getByLabelText("Search files by name"), "report")
    await selectDropdownValue(user, screen.getByLabelText("File type"), "pdf")
    await selectDropdownValue(user, screen.getByLabelText("Order"), "older")

    await waitFor(() => expect(requests.at(-1)).toEqual({ q: "report", type: "pdf", sort: "older", page: "1" }))
  })
})
