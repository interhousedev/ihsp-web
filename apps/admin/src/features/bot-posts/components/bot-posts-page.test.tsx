import { describe, expect, test } from "bun:test"
import type { BotPostTreeNode } from "@ihsp/api"
import { http, HttpResponse } from "msw"
import { renderWithProviders, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import adminMessages from "../../../../messages/en.json"
import { BotPostsPage } from "./bot-posts-page"

function post(overrides: Partial<BotPostTreeNode> & Pick<BotPostTreeNode, "id">): BotPostTreeNode {
  return {
    parent_id: null,
    slug: overrides.id,
    title: { en: overrides.id },
    body: { en: "<b>Hello</b>" },
    audience: "both",
    sort_order: 0,
    published: true,
    is_root: false,
    buttons: [],
    children: [],
    ...overrides,
  }
}

function tree(): BotPostTreeNode {
  const prices = post({ id: "Prices", parent_id: "main", title: { en: "Prices" }, sort_order: 0 })
  return post({ id: "main", title: { en: "Main menu" }, is_root: true, slug: "main-menu", children: [prices] })
}

function problemResponse(status: number, type: string) {
  return HttpResponse.json(
    { type, title: type, status, message_key: type, errors: null },
    { status, headers: { "Content-Type": "application/problem+json" } },
  )
}

describe("BOT-POSTS page", () => {
  test("BOT-POSTS-8 shows the tree from the root and selects the root first", async () => {
    server.use(http.get("*/v1/admin/posts/tree", () => HttpResponse.json(tree())))

    renderWithProviders(<BotPostsPage />, { messages: adminMessages })

    expect(await screen.findByRole("button", { name: "Main menu" })).toHaveAttribute("aria-current", "true")
    expect(screen.getByRole("button", { name: "Prices" })).toBeInTheDocument()
  })

  test("BOT-POSTS-9 shows the mapped message when the slug is taken", async () => {
    server.use(
      http.get("*/v1/admin/posts/tree", () => HttpResponse.json(tree())),
      http.patch("*/v1/admin/posts/:id", () => problemResponse(409, "posts/slug-taken")),
    )
    const { user } = renderWithProviders(<BotPostsPage />, { messages: adminMessages })

    await user.click(await screen.findByRole("button", { name: "Prices" }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByText("This slug is already used.")).toBeInTheDocument()
  })

  test("BOT-POSTS-10 offers to delete the branch when the post has children and sends cascade=true", async () => {
    const cascades: string[] = []
    const branch = post({
      id: "Prices",
      parent_id: "main",
      title: { en: "Prices" },
      children: [post({ id: "Sub", parent_id: "Prices", title: { en: "Sub" } })],
    })
    const root = post({ id: "main", title: { en: "Main menu" }, is_root: true, slug: "main-menu", children: [branch] })
    server.use(
      http.get("*/v1/admin/posts/tree", () => HttpResponse.json(root)),
      http.delete("*/v1/admin/posts/:id", ({ request }) => {
        const cascade = new URL(request.url).searchParams.get("cascade") ?? "false"
        cascades.push(cascade)
        return cascade === "true" ? new HttpResponse(null, { status: 204 }) : problemResponse(409, "posts/has-children")
      }),
    )
    const { user } = renderWithProviders(<BotPostsPage />, { messages: adminMessages })

    await user.click(await screen.findByRole("button", { name: "Prices" }))
    await user.click(screen.getByRole("button", { name: "Delete post" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Delete post" }))
    await user.click(await within(dialog).findByRole("button", { name: "Delete with sub-posts" }))

    expect(cascades).toEqual(["false", "true"])
  })
})
