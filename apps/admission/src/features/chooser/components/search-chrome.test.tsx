import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { renderAdmissionApp } from "../../../tests/helpers"
import { ChooserPage } from "./chooser-page"
import { countryName } from "./option-label"
import { openUniChat } from "../../discover/api"

describe("search chrome", () => {
  test("ADM-SEARCH-1: the section strip is rendered once and there is no Programs switch", async () => {
    renderAdmissionApp(<ChooserPage>body</ChooserPage>, { route: "/chooser/search/" })
    const budget = await screen.findAllByRole("link", { name: "Budget" })
    expect(budget).toHaveLength(1)
    // The page's own strip, not the applicant's bottom bar that the shell renders beside it.
    const strip = budget[0].closest("nav") as HTMLElement
    expect(within(strip).queryByRole("link", { name: "Programs" })).toBeNull()
    expect(within(strip).queryByRole("link", { name: "Universities" })).toBeNull()
  })

  test("ADM-SEARCH-2: country names fall back to the uz and ru table", () => {
    expect(countryName("Germany", "uz")).not.toBe("Germany")
    expect(countryName("United Kingdom", "ru")).not.toBe("United Kingdom")
    expect(countryName("DE", "en")).toBe("Germany")
    expect(countryName("Atlantis", "uz")).toBe("Atlantis")
  })

  test("ADM-SEARCH-3: the university chat is opened in the UI locale", async () => {
    let language: string | null = null
    server.use(
      http.post(apiUrl("/v1/admission/uni-chats/u1"), ({ request }) => {
        language = request.headers.get("accept-language")
        return HttpResponse.json({ chat_id: "c1" })
      }),
    )
    await openUniChat("u1", "en")
    expect(language as string | null).toBe("en")
  })
})
