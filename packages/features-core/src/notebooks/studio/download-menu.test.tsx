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
        return new HttpResponse(new Blob(["PK"]), {
          headers: { "Content-Type": "application/octet-stream" },
        })
      }),
    )
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(
      await screen.findByRole("button", {
        name: `Actions for ${artifactDataTable.title}`,
      }),
    )
    await user.click(await screen.findByRole("menuitem", { name: "Download .xlsx" }))

    await waitFor(() => expect(asked).toBe("xlsx"))
    await waitFor(() => expect(saved).toEqual(["Stages-of-photosynthesis.xlsx"]))
    HTMLAnchorElement.prototype.click = click
  })

  it("offers .pptx for slides", async () => {
    server.use(http.get(ARTIFACTS_URL, () => HttpResponse.json([artifactSlides])))
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(
      await screen.findByRole("button", {
        name: `Actions for ${artifactSlides.title}`,
      }),
    )

    expect(await screen.findByRole("menuitem", { name: "Download .pptx" })).toBeInTheDocument()
  })

  it("offers a Markdown download for a mind map", async () => {
    server.use(http.get(ARTIFACTS_URL, () => HttpResponse.json([artifactMindMap])))
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(
      await screen.findByRole("button", {
        name: `Actions for ${artifactMindMap.title}`,
      }),
    )

    expect(await screen.findByRole("menuitem", { name: "Download .md" })).toBeInTheDocument()
  })

  it("adds a copy to My files", async () => {
    const bodies: unknown[] = []
    server.use(
      http.get(ARTIFACTS_URL, () => HttpResponse.json([artifactMindMap])),
      http.post(`${ARTIFACTS_URL}/:aid/save-to-files`, async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(
          {
            id: "f1",
            name: "Map.md",
            content_type: "text/markdown",
            byte_size: 9,
          },
          { status: 201 },
        )
      }),
    )
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(
      await screen.findByRole("button", {
        name: `Actions for ${artifactMindMap.title}`,
      }),
    )
    await user.click(await screen.findByRole("menuitem", { name: "Add to my files" }))

    await waitFor(() => expect(bodies).toEqual([{ format: "md" }]))
  })

  it("shares through a short link to the saved file", async () => {
    const links: unknown[] = []
    server.use(
      http.get(ARTIFACTS_URL, () => HttpResponse.json([artifactDataTable])),
      http.post(`${ARTIFACTS_URL}/:aid/save-to-files`, () =>
        HttpResponse.json({ id: "f1", name: "T.xlsx", content_type: "x", byte_size: 9 }, { status: 201 }),
      ),
      http.post(apiUrl("/v1/links"), async ({ request }) => {
        links.push(await request.json())
        return HttpResponse.json({ id: "l1", slug: "abc", kind: "file", url: "https://go.test/abc" }, { status: 201 })
      }),
    )
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(
      await screen.findByRole("button", {
        name: `Actions for ${artifactDataTable.title}`,
      }),
    )
    await user.click(await screen.findByRole("menuitem", { name: "Share" }))

    await waitFor(() => expect(links).toEqual([{ kind: "file", file_id: "f1" }]))
    await waitFor(async () => expect(await navigator.clipboard.readText()).toBe("https://go.test/abc"))
  })
})
