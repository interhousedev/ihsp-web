/** CERT-9: the student fills a type's custom fields; a required one blocks saving and the values are sent. */
import { describe, expect, test } from "bun:test"
import { apiUrl, certificateTypes, server, setDropdownValue } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { CertificatesSection } from "../features/profile/components/certificates-section"
import { configureTests, renderSp } from "./helpers"

configureTests()

const LABEL = { uz: "Izoh", ru: "Заметка", en: "Note" }
const TRACK = { uz: "Yo'nalish", ru: "Направление", en: "Track" }

describe("student custom fields", () => {
  test("a required custom field blocks saving; the values are sent with the entry", async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.get(apiUrl("/v1/certificates/types"), () =>
        HttpResponse.json(
          certificateTypes.map((kind) =>
            kind.code === "cefr"
              ? {
                  ...kind,
                  custom_fields: [
                    { key: "note", kind: "text", label: LABEL, required: true, options: [], allow_other: false },
                    {
                      key: "track",
                      kind: "single",
                      label: TRACK,
                      required: false,
                      options: ["math", "art"],
                      allow_other: false,
                    },
                  ],
                }
              : kind,
          ),
        ),
      ),
      http.post(apiUrl("/v1/certificates/me"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          { ...(body as object), id: "x", files: [], custom_values: body.custom ?? {} },
          { status: 201 },
        )
      }),
    )
    const { user } = renderSp(<CertificatesSection />)
    await screen.findByText("7.0 · 2026")

    await user.click(screen.getByRole("button", { name: "Add CEFR" }))
    const dialog = await screen.findByRole("dialog")
    await waitFor(() => expect(within(dialog).getByLabelText(/Track/)).toBeInTheDocument())
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled()

    setDropdownValue(within(dialog).getByLabelText(/Note/), "Excellent")
    setDropdownValue(within(dialog).getByLabelText(/Track/), "math")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toMatchObject({ custom: { note: "Excellent", track: "math" } })
  })
})
