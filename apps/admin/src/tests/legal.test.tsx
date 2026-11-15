/** Legal documents page: the four kinds, the draft editor and the publish confirmation. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { LegalPage } from "../features/legal/components/legal-page"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

describe("legal documents page", () => {
  test("lists the four kinds with version, draft and acceptance counts", async () => {
    renderAdmin(<LegalPage />, { route: "/legal/" })

    const list = await screen.findByRole("list", { name: "Legal documents" })
    await waitFor(() => expect(within(list).getAllByRole("listitem")).toHaveLength(4))
    expect(within(list).getByText("Privacy policy")).toBeInTheDocument()
    expect(within(list).getByText("Draft v2")).toBeInTheDocument()
    await waitFor(() => expect(within(list).getByText("120")).toBeInTheDocument())
    expect(within(list).getByText("118")).toBeInTheDocument()
  })

  test("saves the draft with the three languages", async () => {
    let body: { title: Record<string, string> } | null = null
    server.use(
      http.put(apiUrl("/v1/admin/legal/drafts/:kind"), async ({ request }) => {
        body = (await request.json()) as { title: Record<string, string> }
        return HttpResponse.json({})
      }),
    )
    const { user } = renderAdmin(<LegalPage />, { route: "/legal/" })

    await user.click((await screen.findAllByRole("button", { name: "Edit" }))[0] as HTMLElement)
    await user.click(await screen.findByRole("button", { name: "Save draft" }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(Object.keys((body as unknown as { title: Record<string, string> }).title).toSorted()).toEqual([
      "en",
      "ru",
      "uz",
    ])
  })

  test("publish asks for confirmation and then calls the endpoint", async () => {
    let published = 0
    server.use(
      http.post(apiUrl("/v1/admin/legal/drafts/:kind/publish"), () => {
        published += 1
        return HttpResponse.json({})
      }),
    )
    const { user } = renderAdmin(<LegalPage />, { route: "/legal/" })

    await user.click((await screen.findAllByRole("button", { name: "Edit" }))[0] as HTMLElement)
    await user.click(await screen.findByRole("button", { name: "Publish" }))
    expect(
      await screen.findByText("Every user must accept the new version again before they can continue."),
    ).toBeInTheDocument()
    expect(published).toBe(0)

    const dialog = screen.getByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Publish" }))

    await waitFor(() => expect(published).toBe(1))
  })

  test("a 422 legal/incomplete is shown", async () => {
    server.use(
      http.post(apiUrl("/v1/admin/legal/drafts/:kind/publish"), () =>
        HttpResponse.json(
          { type: "legal/incomplete", title: "Incomplete", status: 422 },
          { status: 422, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderAdmin(<LegalPage />, { route: "/legal/" })

    await user.click((await screen.findAllByRole("button", { name: "Edit" }))[0] as HTMLElement)
    await user.click(await screen.findByRole("button", { name: "Publish" }))
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Publish" }))

    expect(await screen.findByText("Fill in the title and text in every language first.")).toBeInTheDocument()
  })
})
