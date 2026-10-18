/** CERT-1..4: the student's certificates: list per type, add with the fields of the type, files, delete, EMIS import. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server, setDropdownValue } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { CertificatesSection } from "../features/profile/components/certificates-section"
import { configureTests, renderSp } from "./helpers"

configureTests()

describe("student certificates", () => {
  test("lists entries under their type", async () => {
    renderSp(<CertificatesSection />)

    expect(await screen.findByText("7.0 · 2026")).toBeInTheDocument()
    expect(screen.getByText("ielts.pdf")).toBeInTheDocument()
    expect(screen.getByText("A · 82.5% · Mathematics · 2025")).toBeInTheDocument()
    expect(screen.getByText("From EMIS")).toBeInTheDocument()
  })

  test("adds an entry asking only for the fields of the type", async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post(apiUrl("/v1/certificates/me"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...(body as object), id: "x", files: [] }, { status: 201 })
      }),
    )
    const { user } = renderSp(<CertificatesSection />)
    await screen.findByText("7.0 · 2026")

    await user.click(screen.getByRole("button", { name: "Add CEFR" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).queryByLabelText("Score")).toBeNull()
    setDropdownValue(within(dialog).getByLabelText("Level"), "B2")
    setDropdownValue(within(dialog).getByLabelText("Year"), "2026")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toMatchObject({ level: "B2", year: 2026, score: null })
  })

  test("uploads several files to an entry", async () => {
    const names: string[] = []
    server.use(
      http.post(apiUrl("/v1/certificates/me/:id/files"), async ({ request }) => {
        const file = (await request.formData()).get("file") as File
        names.push(file.name)
        return HttpResponse.json({ id: file.name, name: file.name, size: 1, content_type: file.type }, { status: 201 })
      }),
    )
    const { user } = renderSp(<CertificatesSection />)
    await screen.findByText("7.0 · 2026")

    const inputs = screen.getAllByLabelText("Add files", { selector: "input" })
    await user.upload(inputs[0]!, [
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.pdf", { type: "application/pdf" }),
    ])

    await waitFor(() => expect(names).toEqual(["a.png", "b.pdf"]))
  })

  test("asks before deleting a file and keeps it on cancel", async () => {
    let deleted = false
    server.use(
      http.delete(apiUrl("/v1/certificates/me/:id/files/:fileId"), () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderSp(<CertificatesSection />)
    await screen.findByText("ielts.pdf")

    await user.click(screen.getByRole("button", { name: "Delete file ielts.pdf" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    expect(deleted).toBe(false)

    await user.click(screen.getByRole("button", { name: "Delete file ielts.pdf" }))
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }))
    await waitFor(() => expect(deleted).toBe(true))
  })

  test("deletes an entry after confirmation", async () => {
    let deleted: string | null = null
    server.use(
      http.delete(apiUrl("/v1/certificates/me/:id"), ({ params }) => {
        deleted = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderSp(<CertificatesSection />)
    await screen.findByText("7.0 · 2026")

    await user.click(screen.getAllByRole("button", { name: "Delete entry" })[0]!)
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleted).not.toBeNull())
  })

  test("shows the counts after loading from EMIS", async () => {
    const { user } = renderSp(<CertificatesSection />)
    await screen.findByText("7.0 · 2026")

    await user.click(screen.getByRole("button", { name: "Load National Certificate and CEFR from EMIS" }))

    expect(await screen.findByText("Created 2, updated 1, files 3, skipped 0.")).toBeInTheDocument()
  })
})
