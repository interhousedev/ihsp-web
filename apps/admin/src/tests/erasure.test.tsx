/** Erasure requests page: the queue, approve (irreversible) and reject with a reason, both behind a confirmation. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ErasurePage } from "../features/erasure/components/erasure-page"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

describe("erasure requests page", () => {
  test("lists the requests with the requester, role and state", async () => {
    renderAdmin(<ErasurePage />, { route: "/erasure/" })

    const list = await screen.findByRole("list", { name: "Erasure requests" })
    await waitFor(() => expect(within(list).getAllByRole("listitem")).toHaveLength(2))
    expect(within(list).getByText("Aziz Karimov")).toBeInTheDocument()
    expect(within(list).getByText("Malika Saidova")).toBeInTheDocument()
    expect(within(list).getAllByText("Awaiting review")).toHaveLength(2)
  })

  test("approve warns it is irreversible and calls the endpoint only after the confirmation", async () => {
    const approved: string[] = []
    server.use(
      http.post(apiUrl("/v1/admin/privacy/erasure-requests/:id/approve"), ({ params }) => {
        approved.push(String(params.id))
        return HttpResponse.json({})
      }),
    )
    const { user } = renderAdmin(<ErasurePage />, { route: "/erasure/" })

    await user.click(await screen.findByRole("button", { name: "Approve the request of Aziz Karimov" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText(/This cannot be undone/)).toBeInTheDocument()
    expect(approved).toHaveLength(0)
    await user.click(within(dialog).getByRole("button", { name: "Approve" }))

    await waitFor(() => expect(approved).toEqual(["0f1e2d3c-0000-4000-8000-0000000000d1"]))
  })

  test("reject sends the reason after the confirmation; cancelling the dialog sends nothing", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/admin/privacy/erasure-requests/:id/reject"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({})
      }),
    )
    const { user } = renderAdmin(<ErasurePage />, { route: "/erasure/" })

    await user.click(await screen.findByRole("button", { name: "Reject the request of Aziz Karimov" }))
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }))
    expect(bodies).toHaveLength(0)

    await user.click(await screen.findByRole("button", { name: "Reject the request of Aziz Karimov" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.type(within(dialog).getByLabelText("Reason shown to the user (optional)"), "Open exams")
    await user.click(within(dialog).getByRole("button", { name: "Reject" }))

    await waitFor(() => expect(bodies).toEqual([{ reason: "Open exams" }]))
  })

  test("an empty queue shows the empty text", async () => {
    server.use(http.get(apiUrl("/v1/admin/privacy/erasure-requests"), () => HttpResponse.json({ items: [] })))
    renderAdmin(<ErasurePage />, { route: "/erasure/" })

    expect(await screen.findByText("No erasure requests.")).toBeInTheDocument()
  })
})
