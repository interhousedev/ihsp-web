/** The essay share dialog: the new link is shown once, with the token in the fragment, and links can be revoked. */
import { describe, expect, it } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { ShareDialog } from "../features/essay-invites/components/share-dialog"
import { renderAdmissionApp } from "./helpers"

const messages = {
  essayInvites: {
    title: "Share for review",
    description: "d",
    formLabel: "New review link",
    audienceLabel: "Who is it for",
    audience: { classmate: "Classmate", parent: "Parent", counselor: "Counselor", other: "Other" },
    canComment: "Can comment",
    readOnly: "Read only",
    ttlLabel: "Expires in (days)",
    ttlInvalid: "Enter {min} to {max}.",
    create: "Create link",
    linkLabel: "Review link",
    linkOnce: "Copy this link now. It is shown only once.",
    copy: "Copy link",
    activeTitle: "Active links",
    none: "No active links.",
    expires: "Expires {time}",
    comments: "{count} comments",
    revoke: "Revoke",
  },
}

const invite = {
  id: "i1",
  audience: "parent",
  can_comment: true,
  label: null,
  active: true,
  expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  created_at: null,
  last_opened_at: null,
  revoked_at: null,
  comment_count: 2,
}
const URL_ = apiUrl("/v1/admission/essays/e1/invites")

describe("essay share dialog", () => {
  it("shows the new link once with the token in the fragment", async () => {
    let items: unknown[] = []
    let body: unknown
    server.use(
      http.get(URL_, () => HttpResponse.json({ items })),
      http.post(URL_, async ({ request }) => {
        body = await request.json()
        items = [invite]
        return HttpResponse.json({ ...invite, token: "rvw_secret" }, { status: 201 })
      }),
    )
    const view = renderAdmissionApp(<ShareDialog essayId="e1" open onOpenChange={() => {}} />, { messages })
    fireEvent.click(await screen.findByRole("button", { name: "Create link" }))
    const field = (await screen.findByDisplayValue(/essay-review\/#rvw_secret$/)) as HTMLInputElement
    expect(field.value).not.toContain("?")
    expect(body).toEqual({ audience: "classmate", can_comment: true, ttl_days: 30 })
    expect(await screen.findByText("Parent · Can comment")).toBeDefined()
    view.unmount()
    renderAdmissionApp(<ShareDialog essayId="e1" open onOpenChange={() => {}} />, { messages })
    await screen.findByText("Parent · Can comment")
    expect(screen.queryByDisplayValue(/rvw_secret/)).toBeNull()
  })

  it("revokes an active link", async () => {
    let revoked = false
    server.use(
      http.get(URL_, () => HttpResponse.json({ items: revoked ? [] : [invite] })),
      http.delete(`${URL_}/i1`, () => {
        revoked = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAdmissionApp(<ShareDialog essayId="e1" open onOpenChange={() => {}} />, { messages })
    fireEvent.click(await screen.findByRole("button", { name: "Revoke" }))
    await waitFor(() => expect(revoked).toBe(true))
    expect(await screen.findByText("No active links.")).toBeDefined()
  })
})
