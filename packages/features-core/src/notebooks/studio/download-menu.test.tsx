import { describe, expect, it } from "bun:test"
import {
  apiUrl,
  artifactDataTable,
  artifactMindMap,
  artifactSlides,
  nbIds,
  notebookDetail,
  server,
} from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { StudioPanel } from "./studio-panel"

allowSlowRenders()

const ARTIFACTS_URL = apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts`)

describe("Studio item menu: Office downloads", () => {
  it("offers .xlsx for a data table and fetches that format", async () => {
    let asked: string | null = null
    const saved: string[] = []
    URL.createObjectURL = () => "blob:test"
    URL.revokeObjectURL = () => undefined
    const click = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      saved.push(this.download)
    }
    server.use(
      http.get(ARTIFACTS_URL, () => HttpResponse.json([artifactDataTable, artifactSlides, artifactMindMap])),
      http.get(`${ARTIFACTS_URL}/:aid/download`, ({ request }) => {
        asked = new URL(request.url).searchParams.get("format")
        return new HttpResponse(new Blob(["PK"]), { headers: { "Content-Type": "application/octet-stream" } })
      }),
    )
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(await screen.findByRole("button", { name: `Actions for ${artifactDataTable.title}` }))
    await user.click(await screen.findByRole("menuitem", { name: "Download .xlsx" }))

    await waitFor(() => expect(asked).toBe("xlsx"))
    await waitFor(() => expect(saved).toEqual(["Stages-of-photosynthesis.xlsx"]))
    HTMLAnchorElement.prototype.click = click
  })

  it("offers .pptx for slides", async () => {
    server.use(http.get(ARTIFACTS_URL, () => HttpResponse.json([artifactSlides])))
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(await screen.findByRole("button", { name: `Actions for ${artifactSlides.title}` }))

    expect(await screen.findByRole("menuitem", { name: "Download .pptx" })).toBeInTheDocument()
  })

  it("offers no Office download for a mind map", async () => {
    server.use(http.get(ARTIFACTS_URL, () => HttpResponse.json([artifactMindMap])))
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(await screen.findByRole("button", { name: `Actions for ${artifactMindMap.title}` }))

    await screen.findByRole("menuitem", { name: "Rename" })
    expect(screen.queryByRole("menuitem", { name: /^Download/ })).not.toBeInTheDocument()
  })
})
