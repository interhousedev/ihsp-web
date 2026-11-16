/** Setup wizard conditional visibility, the words suggest flow and the safeguarding report. */
import { describe, expect, it, mock } from "bun:test"
import { apiUrl, server, setTestRoute } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { profile, question, useSetupHandlers, wizardConfig } from "./admission-handlers"
import { renderAdmissionApp } from "./helpers"

// happy-dom rejects the promise of a cancelled Web Animation when motion unmounts an element.
// Without `animate`, motion falls back to its JS animations.
Object.defineProperty(window.Element.prototype, "animate", { value: undefined, configurable: true })

// The shell (nav, consent gate) is covered by shell.test.tsx; these tests look at the pages only.
mock.module("../features/shell/components/admission-shell", () => ({
  AdmissionShell: ({ children }: { children: unknown }) => children,
}))

const { AlignmentPage } = await import("../features/alignment/components/alignment-page")
const { SetupWizard } = await import("../features/profile/components/setup-wizard")
const { WordsPage } = await import("../features/words/components/words-page")

const config = wizardConfig([
  question({ id: "q01", required: true }),
  question({ id: "q38", section: "goals", kind: "switch", visible_if: "account_kind=alumni" }),
])

describe("setup wizard", () => {
  it("hides an alumni-only question from a student", async () => {
    setTestRoute("/setup/")
    useSetupHandlers(config, profile())
    renderAdmissionApp(<SetupWizard />)
    expect(await screen.findByText("Step 1 of 1")).toBeInTheDocument()
  })

  it("shows it to an alumnus and resumes at the next question", async () => {
    setTestRoute("/setup/")
    useSetupHandlers(config, profile({ account_kind: "alumni", next_question: "q38" }))
    renderAdmissionApp(<SetupWizard />)
    expect(await screen.findByText("Step 2 of 2")).toBeInTheDocument()
  })
})

const words = (extra = {}) => ({
  words: [],
  candidates: [],
  source: null,
  version: 0,
  confirmed_at: null,
  lock_version: null,
  ...extra,
})

describe("words", () => {
  it("suggests, picks and locks", async () => {
    setTestRoute("/words/")
    let locked: unknown = null
    server.use(
      http.get(apiUrl("/v1/admission/me/words"), () => HttpResponse.json(words())),
      http.post(apiUrl("/v1/admission/me/words/suggest"), () =>
        HttpResponse.json(
          words({ candidates: [{ word: "maker", reason: "You built a robot", evidence_refs: ["q21"] }] }),
        ),
      ),
      http.put(apiUrl("/v1/admission/me/words"), async ({ request }) => {
        locked = await request.json()
        return HttpResponse.json(words({ confirmed_at: "2026-01-01T00:00:00Z", version: 1 }))
      }),
    )
    const user = userEvent.setup()
    renderAdmissionApp(<WordsPage />)
    await user.click(await screen.findByRole("button", { name: "Suggest words" }))
    await user.click(await screen.findByRole("button", { name: "Add “maker”" }))
    expect(screen.getByText("1 of 3 words")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Why “maker”?" }))
    expect(screen.getByText("You built a robot")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lock words" })).toBeDisabled()
    await user.type(screen.getByLabelText("Your words"), "curious{Enter}kind{Enter}")
    await user.click(screen.getByRole("button", { name: "Lock words" }))
    await user.click(
      await screen
        .findByRole("button", { name: "Lock words", hidden: false })
        .then(() => screen.getAllByRole("button", { name: "Lock words" }).at(-1)!),
    )
    await waitFor(() => expect(locked).toEqual({ words: ["maker", "curious", "kind"], lock_version: null }))
  })
})

describe("alignment", () => {
  it("shows the support message and no grade when safeguarding is flagged", async () => {
    setTestRoute("/alignment/")
    server.use(
      http.get(apiUrl("/v1/admission/me/alignment"), () =>
        HttpResponse.json({
          created_at: "2026-01-01T00:00:00Z",
          grades: {},
          message_key: "admission-safeguarding-support",
          overall: null,
          payload: { message_key: "admission-safeguarding-support" },
          safety_flag: "safeguarding",
          stale: false,
          words_version: 1,
        }),
      ),
    )
    renderAdmissionApp(<AlignmentPage />)
    expect(await screen.findByText("We are here for you")).toBeInTheDocument()
    expect(screen.queryByRole("img", { name: /Grade/ })).toBeNull()
  })
})
