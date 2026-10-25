/** Lesson and subject materials: a Preview button opens the file preview window of the notebooks. */
import { describe, expect, test } from "bun:test"
import { apiUrl, filePdf, resourceMaterial, resourceMaterialFile, server } from "@ihsp/test-utils"
import { mergeMessages } from "@ihsp/i18n"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ResourceList } from "../features/lessons/components/resource-list"
import enNotebooks from "../../messages/en/notebooks.json"
import { configureTests, messages, renderSp } from "./helpers"

configureTests()

const withNotebooks = mergeMessages(messages.en, enNotebooks)

describe("ResourceList: Preview", () => {
  test("a PDF material opens the preview window with an inline link of its file", async () => {
    const asked: string[] = []
    server.use(
      http.get(apiUrl(`/v1/files/${filePdf.id}/url`), ({ request }) => {
        asked.push(new URL(request.url).searchParams.get("disposition") ?? "")
        return HttpResponse.json({ url: "https://storage.test/notes.pdf", expires_at: "2026-10-07T05:13:00Z" })
      }),
    )
    const { user } = renderSp(<ResourceList items={[resourceMaterialFile]} />, { messages: withNotebooks })

    await user.click(screen.getByRole("button", { name: `Preview ${resourceMaterialFile.title}` }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(filePdf.name)).toBeInTheDocument()
    // How the PDF itself is drawn belongs to the notebooks preview; here only the inline link matters.
    await waitFor(() => expect(asked).toEqual(["inline"]))
  })

  test("a web link has no Preview button", () => {
    renderSp(<ResourceList items={[resourceMaterial]} />, { messages: withNotebooks })

    expect(screen.queryByRole("button", { name: `Preview ${resourceMaterial.title}` })).not.toBeInTheDocument()
  })

  test("a document the browser cannot show has no Preview button", () => {
    const docx = {
      ...resourceMaterialFile,
      title: "essay.docx",
      file: {
        ...filePdf,
        name: "essay.docx",
        content_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    }
    renderSp(<ResourceList items={[docx]} />, { messages: withNotebooks })

    expect(screen.queryByRole("button", { name: "Preview essay.docx" })).not.toBeInTheDocument()
  })
})
