import { describe, expect, it } from "bun:test"
import { apiUrl, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, readBody, renderTools } from "../../assistant/utils/tools-test-utils"
import { CopySharedSet } from "./copy-shared-set"

allowSlowRenders()

describe("CopySharedSet (SHR-5)", () => {
  it("copies the shared set once and opens the copy", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/me/flashcard-sets/copy"), async ({ request }) => {
        bodies.push(await readBody(request))
        return HttpResponse.json({
          id: "0000000c-0000-4000-8000-0000000000cc",
          title: "Physics: kinematics",
          description: null,
          source: "copied",
          card_count: 4,
          due_today: 0,
          new_today: 4,
          new_per_day: 20,
          reviews_per_day: 200,
          cards: [],
        })
      }),
    )

    renderTools(<CopySharedSet />, { route: "/flashcards/copy/?share=zr5t8w1c" })

    await waitFor(() =>
      expect(testRouter.replace).toHaveBeenCalledWith("/flashcards/set/?id=0000000c-0000-4000-8000-0000000000cc"),
    )
    expect(bodies).toEqual([{ share_slug: "zr5t8w1c" }])
  })

  it("shows the error with a retry when the share was removed", async () => {
    server.use(
      http.post(apiUrl("/v1/me/flashcard-sets/copy"), () =>
        HttpResponse.json(
          { type: "common/not-found", status: 404, title: "Not found" },
          { status: 404, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )

    renderTools(<CopySharedSet />, { route: "/flashcards/copy/?share=gone" })

    expect(await screen.findByText("We could not find what you are looking for.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
  })

  it("explains an incomplete link", async () => {
    renderTools(<CopySharedSet />, { route: "/flashcards/copy/" })

    expect(await screen.findByText("This copy link is incomplete.")).toBeInTheDocument()
  })
})
