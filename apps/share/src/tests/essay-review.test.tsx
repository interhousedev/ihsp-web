/** The reviewer page: the token comes from the fragment, is cleared from the address and is posted with a comment. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ReviewViewer } from "../features/essay-review/review-viewer"
import { allowSlowTests, renderShare } from "./helpers"

allowSlowTests()

const messages = {
  share: {
    essayReview: {
      name: "Your name",
      comment: "Your comment",
      send: "Send comment",
      comments: "Comments",
      noComments: "No comments yet.",
      readOnly: "This link is read-only.",
      words: "{count} words",
      validUntil: "Link valid until {time}",
      notFoundTitle: "This link is not available",
      notFoundText: "Expired or revoked.",
      limitedTitle: "Too many attempts",
      limitedText: "Later.",
    },
  },
}

const review = (can_comment: boolean) => ({
  audience: "classmate",
  can_comment,
  expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  essay: { title: "My story", kind: "personal_statement", prompt_text: "", body: "Once upon a time", word_count: 4 },
  comments: [],
})

function Seeded({ hash }: { hash: string }) {
  window.location.hash = hash
  return <ReviewViewer />
}

describe("essay review page", () => {
  test("opens with the fragment token and posts a comment", async () => {
    const posted: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/public/admission/essay-review/open"), async ({ request }) => {
        posted.push(await request.json())
        return HttpResponse.json(review(true))
      }),
      http.post(apiUrl("/v1/public/admission/essay-review/comments"), async ({ request }) => {
        posted.push(await request.json())
        return HttpResponse.json(
          {
            id: "c1",
            author_name: "Sam",
            body: "Nice",
            created_at: new Date().toISOString(),
            resolved: false,
            detached: false,
            quote: null,
            parent_id: null,
            anchor_start: null,
            anchor_end: null,
          },
          { status: 201 },
        )
      }),
    )
    renderShare(<Seeded hash="#rvw_secret" />, { route: "/ai/essay-review/", messages })
    expect(await screen.findByText("Once upon a time")).toBeInTheDocument()
    expect(window.location.hash).toBe("")
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Sam" } })
    fireEvent.change(screen.getByLabelText("Your comment"), { target: { value: "Nice" } })
    fireEvent.click(screen.getByRole("button", { name: "Send comment" }))
    expect(await screen.findByText("Nice")).toBeInTheDocument()
    await waitFor(() =>
      expect(posted).toEqual([{ token: "rvw_secret" }, { token: "rvw_secret", author_name: "Sam", body: "Nice" }]),
    )
  })

  test("a read-only link has no comment form", async () => {
    server.use(http.post(apiUrl("/v1/public/admission/essay-review/open"), () => HttpResponse.json(review(false))))
    renderShare(<Seeded hash="#rvw_ro" />, { route: "/ai/essay-review/", messages })
    expect(await screen.findByText("This link is read-only.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Send comment" })).toBeNull()
  })

  test("a revoked link shows the friendly not-found state", async () => {
    server.use(
      http.post(apiUrl("/v1/public/admission/essay-review/open"), () =>
        HttpResponse.json({ type: "not-found", title: "Not found", status: 404 }, { status: 404 }),
      ),
    )
    renderShare(<Seeded hash="#rvw_gone" />, { route: "/ai/essay-review/", messages })
    expect(await screen.findByText("This link is not available")).toBeInTheDocument()
  })
})
