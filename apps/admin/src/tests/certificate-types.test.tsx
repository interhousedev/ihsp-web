/** CERT-5: certificate types page: create, edit, delete with confirmation; built-in types cannot be deleted. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server, setDropdownValue } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { CertificateTypesPage } from "../features/certificates/components/certificate-types-page"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

describe("certificate types page", () => {
  test("lists the types and disables deleting built-in ones", async () => {
    renderAdmin(<CertificateTypesPage />, { route: "/certificate-types/" })

    expect(await screen.findByText("IELTS")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Delete type CEFR" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Delete type IELTS" })).toBeEnabled()
    expect(screen.getAllByTitle("Built-in types cannot be deleted")).toHaveLength(2)
  })

  test("creates a type with levels and the fields to ask", async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post(apiUrl("/v1/certificates/admin/types"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...(body as object), id: "n", builtin: false }, { status: 201 })
      }),
    )
    const { user } = renderAdmin(<CertificateTypesPage />, { route: "/certificate-types/" })
    await screen.findByText("IELTS")

    await user.click(screen.getByRole("button", { name: "Add type" }))
    const dialog = await screen.findByRole("dialog")
    setDropdownValue(within(dialog).getByLabelText(/Code/), "toefl")
    setDropdownValue(within(dialog).getByLabelText(/Name \(Uzbek\)/), "TOEFL")
    setDropdownValue(within(dialog).getByLabelText(/Name \(Russian\)/), "TOEFL")
    setDropdownValue(within(dialog).getByLabelText(/Name \(English\)/), "TOEFL")
    setDropdownValue(within(dialog).getByLabelText("Levels"), "80, 90, 80")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toMatchObject({ code: "toefl", levels: ["80", "90"], name: { en: "TOEFL" } })
  })

  test("a custom choice field with options and an other toggle is saved on the type", async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post(apiUrl("/v1/certificates/admin/types"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...(body as object), id: "n", builtin: false }, { status: 201 })
      }),
    )
    const { user } = renderAdmin(<CertificateTypesPage />, { route: "/certificate-types/" })
    await screen.findByText("IELTS")

    await user.click(screen.getByRole("button", { name: "Add type" }))
    const dialog = await screen.findByRole("dialog")
    setDropdownValue(within(dialog).getByLabelText(/Code/), "toefl")
    setDropdownValue(within(dialog).getByLabelText(/Name \(English\)/), "TOEFL")
    setDropdownValue(within(dialog).getByLabelText(/Name \(Uzbek\)/), "TOEFL")
    setDropdownValue(within(dialog).getByLabelText(/Name \(Russian\)/), "TOEFL")
    await user.click(within(dialog).getByRole("button", { name: "Add field" }))
    setDropdownValue(within(dialog).getByLabelText("Key"), "track")
    setDropdownValue(within(dialog).getByLabelText("Kind"), "single")
    setDropdownValue(within(dialog).getByLabelText("Label (en)"), "Track")
    setDropdownValue(within(dialog).getByLabelText("Label (uz)"), "Yo'nalish")
    setDropdownValue(within(dialog).getByLabelText("Label (ru)"), "Направление")
    fireEvent.change(within(dialog).getByLabelText("Options"), { target: { value: "math\nart" } })
    await user.click(within(dialog).getByRole("checkbox", { name: "Allow other (free text)" }))
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toMatchObject({
      custom_fields: [
        {
          key: "track",
          kind: "single",
          label: { en: "Track", uz: "Yo'nalish", ru: "Направление" },
          options: ["math", "art"],
          allow_other: true,
          required: false,
        },
      ],
    })
  })

  test("a choice field without options cannot be saved", async () => {
    const { user } = renderAdmin(<CertificateTypesPage />, { route: "/certificate-types/" })
    await screen.findByText("IELTS")

    await user.click(screen.getByRole("button", { name: "Add type" }))
    const dialog = await screen.findByRole("dialog")
    setDropdownValue(within(dialog).getByLabelText(/Code/), "toefl")
    setDropdownValue(within(dialog).getByLabelText(/Name \(English\)/), "TOEFL")
    setDropdownValue(within(dialog).getByLabelText(/Name \(Uzbek\)/), "TOEFL")
    setDropdownValue(within(dialog).getByLabelText(/Name \(Russian\)/), "TOEFL")
    await user.click(within(dialog).getByRole("button", { name: "Add field" }))
    setDropdownValue(within(dialog).getByLabelText("Key"), "track")
    setDropdownValue(within(dialog).getByLabelText("Kind"), "multi")
    setDropdownValue(within(dialog).getByLabelText("Label (en)"), "Track")
    setDropdownValue(within(dialog).getByLabelText("Label (uz)"), "Yo'nalish")
    setDropdownValue(within(dialog).getByLabelText("Label (ru)"), "Направление")

    expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled()
  })

  test("deleting asks first", async () => {
    let deleted: string | null = null
    server.use(
      http.delete(apiUrl("/v1/certificates/admin/types/:id"), ({ params }) => {
        deleted = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderAdmin(<CertificateTypesPage />, { route: "/certificate-types/" })
    await screen.findByText("IELTS")

    await user.click(screen.getByRole("button", { name: "Delete type IELTS" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(deleted).toBeNull()
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleted).not.toBeNull())
  })
})
