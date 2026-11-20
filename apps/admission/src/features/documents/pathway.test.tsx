import { apiUrl, server, setTestRoute } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { AppReviewPanel } from "../app-review/components/app-review-page"
import { renderAdmissionApp } from "../../tests/helpers"
import { ChecklistSection } from "./components/checklist-section"
import { DocumentsPage } from "./components/documents-page"

const messages = {
  documents: {
    backToList: "Back to my list",
    nextSearch: "Find universities",
    nextReview: "Run application review",
  },
  appReview: { nextOutcomes: "Record results" },
}

const link = async (name: string, role: "link" | "button" = "link") =>
  screen.findByRole(role, { name: new RegExp(name) })

describe("pathway links", () => {
  test("an empty checklist suggests searching for universities", async () => {
    server.use(http.get(apiUrl("/v1/admission/checklist"), () => HttpResponse.json([])))
    renderAdmissionApp(<ChecklistSection />, { messages })
    expect((await link("Find universities")).getAttribute("href")).toBe("/chooser?step=match")
  })

  test("the documents page ends with the application review", async () => {
    setTestRoute("/documents/")
    renderAdmissionApp(<DocumentsPage />, { messages })
    expect((await link("Run application review")).getAttribute("href")).toBe("/review")
  })

  test("an entry in the URL adds a back link to the list", async () => {
    renderAdmissionApp(<DocumentsPage />, { messages, route: "/documents/?entry=e1" })
    // A Button rendered as a Link carries role="button".
    expect((await link("Back to my list", "button")).getAttribute("href")).toBe("/chooser?step=list&entry=e1")
  })

  test("the review page suggests recording results", async () => {
    renderAdmissionApp(<AppReviewPanel />, { messages })
    expect((await link("Record results")).getAttribute("href")).toBe("/outcomes")
  })
})
