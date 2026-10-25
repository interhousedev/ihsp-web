/** SHR-1 to SHR-8 (viewer) and SL-9 (report): the public page behind `/ai/<slug>`. */
import { describe, expect, test } from "bun:test"
import { getConfig, resetConfig } from "@ihsp/config"
import { apiUrl, publicShareGoneSlug, server, setDropdownValue, userMe } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ShareFrame } from "../features/share/share-header"
import { ShareViewer } from "../features/share/share-viewer"
import { StudyMode } from "../features/share/study-mode"
import { slugFromPathname } from "../features/share/use-share-slug"
import { allowSlowTests, renderShare, shareRoute } from "./helpers"

allowSlowTests()

describe("slug from the path", () => {
  test("reads /ai/<slug>/ and ignores the static page and deeper paths", () => {
    expect(slugFromPathname("/ai/kq7x2m9a/")).toBe("kq7x2m9a")
    expect(slugFromPathname("/ai/kq7x2m9a")).toBe("kq7x2m9a")
    expect(slugFromPathname("/ai/view/")).toBeNull()
    expect(slugFromPathname("/ai/")).toBeNull()
    expect(slugFromPathname("/ai/a/b/")).toBeNull()
  })

  test("malformed percent-encoding is no slug (Link not found, not a blank page)", () => {
    expect(slugFromPathname("/ai/%E0%A4%A/")).toBeNull()
  })
})

describe("shared chat", () => {
  test("shows the title, author, the public banner, the messages and the notes of looked-up data", async () => {
    renderShare(<ShareViewer />, { route: shareRoute("kq7x2m9a") })

    expect(
      await screen.findByRole("heading", {
        name: "Kinematics revision",
        hidden: true,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Shared by Aleksey/)).toBeInTheDocument()
    expect(screen.getByText("Shared publicly")).toBeInTheDocument()
    expect(screen.getByText("Explain uniform motion")).toBeInTheDocument()
    expect(screen.getByText("Looked up your timetable")).toBeInTheDocument()
    expect(screen.getByText("Assistant")).toBeInTheDocument()
  })

  test("names the share in the tab title and offers the student app in a footer link and the brand", async () => {
    renderShare(<ShareViewer />, { route: shareRoute("kq7x2m9a") })

    await screen.findByRole("heading", { name: "Kinematics revision", hidden: true })
    await waitFor(() => expect(document.title).toBe("Kinematics revision"))
    expect(screen.getByRole("link", { name: "Open my.iht", hidden: true }).getAttribute("href")).toBe(
      getConfig().SP_URL,
    )
    expect(screen.getByRole("link", { name: "IHT shares", hidden: true }).getAttribute("href")).toBe(getConfig().SP_URL)
  })
})

/** Opens the shared set and presses Study. */
async function startStudying() {
  renderShare(<ShareViewer />, { route: shareRoute("zr5t8w1c") })
  fireEvent.click(await screen.findByRole("button", { name: "Study", hidden: true }))
  await screen.findByTestId("study-counts")
}

/** The labels over the four rating buttons, e.g. `<1m`. */
function intervalLabels(): (string | undefined)[] {
  return ["Again", "Hard", "Good", "Easy"].map((name) => {
    const button = screen.getByRole("button", { name, hidden: true })
    return document.getElementById(button.getAttribute("aria-describedby") ?? "")?.textContent
  })
}

describe("shared flash cards", () => {
  test("lists the cards and copies the set into the student app", async () => {
    renderShare(<ShareViewer />, { route: shareRoute("zr5t8w1c") })

    expect(
      await screen.findByRole("heading", {
        name: "Physics: kinematics",
        hidden: true,
      }),
    ).toBeInTheDocument()
    const copy = screen.getByRole("link", {
      name: "Copy to my decks (sign in)",
      hidden: true,
    })
    expect(copy.getAttribute("href")).toBe(`${getConfig().SP_URL}/flashcards/copy/?share=zr5t8w1c`)
  })

  test("studies with Anki's screen: the question, the counts and Show answer", async () => {
    await startStudying()

    expect(screen.getByText("What is velocity?")).toBeInTheDocument()
    expect(screen.getByTestId("study-counts")).toHaveTextContent("4+0+0")
    expect(screen.queryByText("The rate of change of velocity.")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Show answer", hidden: true }))

    expect(screen.getByTestId("card-back")).toHaveTextContent("The rate of change of position")
    expect(intervalLabels()).toEqual(["<1m", "<1m", "<10m", "4d"])
  })

  test("a card rated Good moves to learning and the next new card follows", async () => {
    await startStudying()
    fireEvent.keyDown(window, { key: " " })
    await screen.findByTestId("card-back")

    fireEvent.keyDown(window, { key: "3" })

    expect(await screen.findByText("What is acceleration?")).toBeInTheDocument()
    expect(screen.getByTestId("study-counts")).toHaveTextContent("3+1+0")
    expect(screen.queryByTestId("card-back")).not.toBeInTheDocument()
  })

  test("studies from the keyboard until every card is Easy, then congratulates", async () => {
    await startStudying()

    for (let index = 0; index < 4; index += 1) {
      fireEvent.keyDown(window, { key: " " })
      await screen.findByTestId("card-back")
      fireEvent.keyDown(window, { key: "4" })
    }

    expect(await screen.findByText("Congratulations! You have finished this deck for now.")).toBeInTheDocument()
    expect(screen.getByText("You answered 4 cards.")).toBeInTheDocument()
  })

  test("saves nothing on the server", async () => {
    const reviews: string[] = []
    server.use(
      http.post(apiUrl("/v1/me/flashcards/:cardId/review"), ({ params }) => {
        reviews.push(String(params.cardId))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await startStudying()

    fireEvent.keyDown(window, { key: " " })
    await screen.findByTestId("card-back")
    fireEvent.keyDown(window, { key: "4" })

    expect(await screen.findByText("What is acceleration?")).toBeInTheDocument()
    expect(reviews).toEqual([])
  })

  test("after the last card, Study again starts over and Back to the cards leaves", async () => {
    await startStudying()
    for (let index = 0; index < 4; index += 1) {
      fireEvent.keyDown(window, { key: " " })
      await screen.findByTestId("card-back")
      fireEvent.keyDown(window, { key: "4" })
    }
    await screen.findByTestId("study-done")

    fireEvent.click(screen.getByRole("button", { name: "Study again", hidden: true }))

    expect(await screen.findByText("What is velocity?")).toBeInTheDocument()
    expect(screen.getByTestId("study-counts")).toHaveTextContent("4+0+0")
    expect(screen.queryByTestId("card-back")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Back to the cards", hidden: true }))

    expect(
      await screen.findByRole("link", {
        name: "Copy to my decks (sign in)",
        hidden: true,
      }),
    ).toBeInTheDocument()
  })
})

describe("study mode of a one card set", () => {
  test("Study again shows the question again, not the answer", async () => {
    renderShare(<StudyMode cards={[{ id: "only", front: "Question", back: "Answer" }]} onExit={() => undefined} />)
    fireEvent.keyDown(window, { key: " " })
    await screen.findByTestId("card-back")
    fireEvent.keyDown(window, { key: "4" })
    await screen.findByTestId("study-done")

    fireEvent.click(screen.getByRole("button", { name: "Study again", hidden: true }))

    expect(await screen.findByText("Question")).toBeInTheDocument()
    expect(screen.queryByTestId("card-back")).not.toBeInTheDocument()
  })
})

describe("states", () => {
  test("an unknown slug is 'Link not found'", async () => {
    renderShare(<ShareViewer />, { route: shareRoute("nope0000") })
    expect(await screen.findByText("Link not found")).toBeInTheDocument()
  })

  test("a removed link is 'This link was removed'", async () => {
    renderShare(<ShareViewer />, { route: shareRoute(publicShareGoneSlug) })
    expect(await screen.findByText("This link was removed")).toBeInTheDocument()
  })

  test("a server error offers a retry", async () => {
    server.use(http.get(apiUrl("/v1/public/shares/:slug"), () => new HttpResponse(null, { status: 500 })))
    renderShare(<ShareViewer />, { route: shareRoute("kq7x2m9a") })
    expect(await screen.findByRole("button", { name: /try again/i, hidden: true })).toBeInTheDocument()
  })
})

describe("report", () => {
  test("sends the slug, the reason and the comment", async () => {
    let body = null as {
      slug: string
      reason: string
      comment?: string
    } | null
    server.use(
      http.post(apiUrl("/v1/public/reports"), async ({ request }) => {
        body = (await request.json()) as typeof body
        return new HttpResponse(null, { status: 202 })
      }),
    )
    renderShare(<ShareViewer />, { route: shareRoute("kq7x2m9a") })
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Report this link",
        hidden: true,
      }),
    )

    setDropdownValue(await screen.findByLabelText("Reason"), "phishing")
    fireEvent.change(screen.getByLabelText("Comment (optional)"), {
      target: { value: "Looks fake" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send report", hidden: true }))

    expect(await screen.findByText("Thank you. Administration will look at this link.")).toBeInTheDocument()
    await waitFor(() =>
      expect(body).toEqual({
        slug: "kq7x2m9a",
        reason: "phishing",
        comment: "Looks fake",
      }),
    )
  })

  test("a rate-limited report shows the error", async () => {
    server.use(
      http.post(apiUrl("/v1/public/reports"), () =>
        HttpResponse.json(
          {
            type: "common/rate-limited",
            title: "Too many",
            status: 429,
            params: { retry_after: 60 },
          },
          {
            status: 429,
            headers: { "Content-Type": "application/problem+json" },
          },
        ),
      ),
    )
    renderShare(<ShareViewer />, { route: shareRoute("kq7x2m9a") })
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Report this link",
        hidden: true,
      }),
    )
    setDropdownValue(await screen.findByLabelText("Reason"), "other")
    fireEvent.click(await screen.findByRole("button", { name: "Send report", hidden: true }))

    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })

  test("no reason is chosen until the user picks one", async () => {
    renderShare(<ShareViewer />, { route: shareRoute("kq7x2m9a") })
    fireEvent.click(await screen.findByRole("button", { name: "Report this link", hidden: true }))

    expect(await screen.findByLabelText("Reason")).toHaveValue("")
    expect(screen.getByRole("button", { name: "Send report", hidden: true })).toBeDisabled()
  })
})

describe("account menu", () => {
  test("is not shown to the public", async () => {
    renderShare(
      <ShareFrame>
        <p>shared page</p>
      </ShareFrame>,
    )

    expect(await screen.findByText("shared page")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Account menu" })).not.toBeInTheDocument()
  })

  test("lists the platforms of the role when someone is logged in on this host", async () => {
    window.__ENV__ = {
      ...(window.__ENV__ as object),
      OAUTH_CLIENT_ID: "share",
    }
    resetConfig()
    const { user } = renderShare(
      <ShareFrame>
        <p>shared page</p>
      </ShareFrame>,
      { session: { user: userMe } },
    )

    await user.click(await screen.findByRole("button", { name: "Account menu" }))

    const menu = await screen.findByRole("menu")
    expect(within(menu).getByRole("menuitem", { name: /my\.iht/ })).toHaveAttribute("href", "http://localhost:3002")
    expect(within(menu).getByRole("menuitem", { name: /lms\.iht/ })).toHaveAttribute("href", "http://localhost:3005")
    expect(within(menu).getByRole("menuitem", { name: /IHT ID/ })).toHaveAttribute("href", "http://localhost:3001")
    expect(within(menu).queryByRole("menuitem", { name: /Учителям/ })).not.toBeInTheDocument()
    expect(menu.querySelector("[aria-current]")).toBeNull()
  })
})

describe("shared Studio outputs", () => {
  test("a report opens read-only in the report viewer, without the notebook actions", async () => {
    renderShare(<ShareViewer />, { route: shareRoute("a-report01") })

    expect(
      await screen.findByRole("heading", {
        name: "Photosynthesis: conspect",
        level: 1,
        hidden: true,
      }),
    ).toBeInTheDocument()
    expect(await screen.findByRole("article", { hidden: true })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add as source", hidden: true })).not.toBeInTheDocument()
  })

  test("a quiz can be taken without saving anything", async () => {
    const saved: string[] = []
    server.use(
      http.put(apiUrl("/v1/notebooks/:id/artifacts/:aid/progress"), ({ params }) => {
        saved.push(String(params.aid))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderShare(<ShareViewer />, { route: shareRoute("a-quiz0001") })

    expect(await screen.findByText("Which gas is released in the light reactions?")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Oxygen"))
    await new Promise((resolve) => setTimeout(resolve, 800))

    expect(saved).toEqual([])
    expect(screen.queryByRole("button", { name: "Explain", hidden: true })).not.toBeInTheDocument()
  })
})
