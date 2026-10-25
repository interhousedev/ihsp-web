import { describe, expect, it, spyOn } from "bun:test"
import type { ArtifactDetail } from "@ihsp/api"
import {
  apiUrl,
  artifactDetailOf,
  artifactFlashcards,
  flashcardsContent,
  nbIds,
  passageId,
  server,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { FlashcardsViewer } from "./flashcards-viewer"

allowSlowRenders()

type FlashArtifact = Extract<ArtifactDetail, { kind: "flashcards" }>

function flashArtifact(extra: Partial<FlashArtifact> = {}): FlashArtifact {
  const detail = artifactDetailOf(artifactFlashcards)
  if (detail.kind !== "flashcards") throw new Error("fixture is not a deck")
  return { ...detail, ...extra }
}

function renderDeck(extra: Partial<FlashArtifact> = {}) {
  return renderNotebook(<FlashcardsViewer notebookId={nbIds.notebook} artifact={flashArtifact(extra)} />)
}

const front = (index: number) => flashcardsContent.cards[index]?.front ?? ""
/** `next/link` adds or drops the trailing slash according to the app's config. */
const SET_HREF = (id: string) => new RegExp(`^/flashcards/set/?\\?id=${id}$`)
const progressUrl = apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts/${artifactFlashcards.id}/progress`)

function recordProgress() {
  const bodies: { state: Record<string, unknown> }[] = []
  server.use(
    http.put(progressUrl, async ({ request }) => {
      bodies.push((await request.json()) as { state: Record<string, unknown> })
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return bodies
}

const cardButton = () => screen.getByRole("button", { name: /Where|What|Which|Name/ })

/** Flips the shown card and marks it with a key. */
async function flipAndMark(user: UserEvent, key: string) {
  await user.click(cardButton())
  await user.keyboard(key)
}

describe("FlashcardsViewer: the card", () => {
  it("shows the first card with its counter and flips it with Space", async () => {
    const { user } = renderDeck()

    expect(screen.getByText("Card 1 of 6")).toBeInTheDocument()
    const card = screen.getByRole("button", { name: new RegExp(front(0)) })
    expect(
      screen.getByText("In the thylakoid membranes of the chloroplast.").closest("[aria-hidden='true']"),
    ).not.toBeNull()
    expect(screen.queryByRole("button", { name: "Got it" })).not.toBeInTheDocument()

    card.focus()
    await user.keyboard(" ")

    expect(screen.getByRole("button", { name: /In the thylakoid membranes/ })).toBe(card)
    expect(
      screen.getByText("In the thylakoid membranes of the chloroplast.").closest("[aria-hidden='true']"),
    ).toBeNull()
    expect(screen.getByText(front(0)).closest("[aria-hidden='true']")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Got it" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Missed it" })).toBeInTheDocument()
  })

  it("marks Got it and Missed it with the keys 2 and 1 and moves on", async () => {
    const { user } = renderDeck()

    await flipAndMark(user, "2")
    expect(screen.getByText("Card 2 of 6")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: new RegExp(front(1)) })).toBeInTheDocument()

    await flipAndMark(user, "1")
    expect(screen.getByText("Card 3 of 6")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Previous" }))
    expect(screen.getByText("Card 2 of 6")).toBeInTheDocument()
    expect(screen.getByText("Missed it", { selector: "span" })).toBeInTheDocument()
  })

  it("marks with the arrow keys and the buttons", async () => {
    const { user } = renderDeck()

    await flipAndMark(user, "{ArrowRight}")
    expect(screen.getByText("Card 2 of 6")).toBeInTheDocument()
    await user.click(cardButton())
    await user.click(screen.getByRole("button", { name: "Missed it" }))
    expect(screen.getByText("Card 3 of 6")).toBeInTheDocument()
  })

  it("keeps the keys for typing in a field", async () => {
    const { user } = renderDeck()
    await user.click(cardButton())
    const field = document.createElement("input")
    document.body.append(field)

    await user.click(field)
    await user.keyboard("2")

    expect(screen.getByText("Card 1 of 6")).toBeInTheDocument()
    field.remove()
  })

  it("steps with Previous and Next without marking", async () => {
    const { user } = renderDeck()
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(screen.getByText("Card 2 of 6")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Got it" })).not.toBeInTheDocument()
  })

  it("reveals a hint once per card", async () => {
    const { user } = renderDeck()

    await user.click(screen.getByRole("button", { name: "Hint" }))
    expect(screen.getByText("Think of the inner membranes")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Hint" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByRole("button", { name: "Hint" })).toBeDisabled()
    expect(screen.queryByText("Think of the inner membranes")).not.toBeInTheDocument()
  })

  it("shows the sources of a card as chips after flipping", async () => {
    const { user } = renderDeck()
    expect(screen.queryByRole("button", { name: /^Source 1/ })).not.toBeInTheDocument()

    await user.click(cardButton())

    expect(screen.getByRole("button", { name: /Source 1: Biology 10\.pdf/ })).toBeInTheDocument()
  })
})

describe("FlashcardsViewer: shuffle, delete, restart", () => {
  it("shuffles the deck and goes back to the first card", async () => {
    spyOn(Math, "random").mockReturnValue(0)
    const { user } = renderDeck()
    await user.click(screen.getByRole("button", { name: "Next" }))

    await user.click(screen.getByRole("button", { name: "Shuffle" }))

    expect(screen.getByText("Card 1 of 6")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: new RegExp(front(1)) })).toBeInTheDocument()
  })

  it("deletes the shown card from the deck", async () => {
    const { user } = renderDeck()

    await user.click(screen.getByRole("button", { name: "Delete card" }))

    expect(screen.getByText("Card 1 of 5")).toBeInTheDocument()
    expect(screen.queryByText(front(0))).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: new RegExp(front(1)) })).toBeInTheDocument()
  })

  it("restarts the round: marks are cleared and the first card is back", async () => {
    const { user } = renderDeck()
    await flipAndMark(user, "2")
    await user.click(screen.getByRole("button", { name: "Previous" }))
    expect(screen.getByText("Got it", { selector: "span" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Restart" }))

    expect(screen.getByText("Card 1 of 6")).toBeInTheDocument()
    expect(screen.queryByText("Got it", { selector: "span" })).not.toBeInTheDocument()
  })
})

async function finishDeck(user: UserEvent) {
  for (const key of ["2", "2", "2", "2", "1", "1"]) await flipAndMark(user, key)
}

describe("FlashcardsViewer: results", () => {
  it("announces the counts when every card is marked", async () => {
    const { user } = renderDeck()

    await finishDeck(user)

    expect(screen.getByRole("status")).toHaveTextContent("Done! Known: 4, missed: 2.")
    expect(screen.queryByRole("button", { name: "Got it" })).not.toBeInTheDocument()
  })

  it("goes again with only the missed cards", async () => {
    const { user } = renderDeck()
    await finishDeck(user)

    await user.click(screen.getByRole("button", { name: "Only missed cards" }))

    expect(screen.getByText("Card 1 of 2")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: new RegExp(front(4)) })).toBeInTheDocument()
  })

  it("goes again with the same cards, and with all cards after deleting one", async () => {
    const { user } = renderDeck()
    await user.click(screen.getByRole("button", { name: "Delete card" }))
    for (const key of ["2", "2", "2", "1", "1"]) await flipAndMark(user, key)
    expect(screen.getByRole("status")).toHaveTextContent("Done! Known: 3, missed: 2.")

    await user.click(screen.getByRole("button", { name: "Same cards" }))
    expect(screen.getByText("Card 1 of 5")).toBeInTheDocument()

    for (const key of ["2", "2", "2", "2", "2"]) await flipAndMark(user, key)
    expect(screen.getByRole("status")).toHaveTextContent("Done! Known: 5, missed: 0.")
    expect(screen.getByRole("button", { name: "Only missed cards" })).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "All cards" }))
    expect(screen.getByText("Card 1 of 5")).toBeInTheDocument()
  })
})

describe("FlashcardsViewer: progress", () => {
  it("saves the progress once after the changes settle", async () => {
    const bodies = recordProgress()
    const { user } = renderDeck()

    await flipAndMark(user, "2")
    await flipAndMark(user, "1")

    await waitFor(() => expect(bodies).toHaveLength(1), { timeout: 3000 })
    expect(bodies[0]).toEqual({
      state: {
        known: ["c1"],
        missed: ["c2"],
        deleted: [],
        order: ["c1", "c2", "c3", "c4", "c5", "c6"],
        position: 2,
      },
    })
  })

  it("sends the last change when the viewer closes", async () => {
    const bodies = recordProgress()
    const { user, unmount } = renderDeck()
    await flipAndMark(user, "2")

    unmount()

    await waitFor(() => expect(bodies).toHaveLength(1), { timeout: 300, interval: 20 })
    expect(bodies[0]?.state.known).toEqual(["c1"])
  })

  it("resumes where the student left off", () => {
    renderDeck({
      progress_state: {
        known: ["c1", "c2"],
        missed: ["c3"],
        deleted: ["c6"],
        order: ["c1", "c2", "c3", "c4", "c5", "c6"],
        position: 3,
      },
    })

    expect(screen.getByText("Card 4 of 5")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: new RegExp(front(3)) })).toBeInTheDocument()
  })

  it("starts fresh when the saved progress has an unknown shape", () => {
    renderDeck({ progress_state: { current: 3, answers: {} } })

    expect(screen.getByText("Card 1 of 6")).toBeInTheDocument()
  })
})

describe("FlashcardsViewer: export and the flash card set", () => {
  it("downloads the cards as CSV with a BOM", async () => {
    const blobs: Blob[] = []
    spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      blobs.push(blob as Blob)
      return "blob:cards"
    })
    spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined)
    const { user } = renderDeck()
    await user.click(screen.getByRole("button", { name: "Delete card" }))

    await user.click(screen.getByRole("button", { name: "Download CSV" }))

    const text = await blobs[0]?.text()
    expect(text?.startsWith("﻿")).toBe(true)
    const lines = (text ?? "").slice(1).split("\r\n")
    expect(lines).toHaveLength(5)
    expect(lines[0]).toBe("Where does the Calvin cycle take place?,In the stroma.,Calvin cycle")
  })

  it("copies the cards as tab-separated text", async () => {
    const { user } = renderDeck()

    await user.click(screen.getByRole("button", { name: "Copy cards" }))

    const copied = await navigator.clipboard.readText()
    expect(copied.split("\n")).toHaveLength(6)
    expect(copied.split("\n")[1]).toBe("Where does the Calvin cycle take place?\tIn the stroma.")
  })

  it("saves the deck as a set and then offers Open set", async () => {
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts/${artifactFlashcards.id}/flashcard-set`), () =>
        HttpResponse.json({ set_id: "set-42", created: true }),
      ),
    )
    const { user } = renderDeck()

    await user.click(screen.getByRole("button", { name: "Save as flash card set" }))

    const link = await screen.findByRole("link", { name: "Open set" })
    expect(link.getAttribute("href")).toMatch(SET_HREF("set-42"))
    expect(screen.queryByRole("button", { name: "Save as flash card set" })).not.toBeInTheDocument()
  })

  it("offers Open set at once when the deck was saved before", () => {
    renderDeck({ flashcard_set_id: "set-7" })

    expect(screen.getByRole("link", { name: "Open set" }).getAttribute("href")).toMatch(SET_HREF("set-7"))
  })
})

describe("FlashcardsViewer: Explain", () => {
  it("asks the notebook chat about the card with an anchor on its passages and shows the cited answer", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/chat/messages`), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({
          user_message: {
            id: "u",
            seq: 3,
            role: "user",
            text: "",
            citations: [],
            followups: [],
            source_ids: [],
            retrieval: false,
            grounded: false,
            feedback: null,
            stopped: false,
            created_at: "2026-10-07T04:40:00Z",
          },
          assistant_message: {
            id: "a",
            seq: 4,
            role: "assistant",
            text: "Light excites electrons in the thylakoids ⟦1⟧.",
            citations: [
              {
                n: 1,
                passage_id: passageId(1, 3),
                source_id: nbIds.sourceFile,
                source_title: "Biology 10.pdf",
                source_kind: "file",
                page: 2,
                snippet: "The light reactions take place in the thylakoid membranes.",
              },
            ],
            followups: [],
            source_ids: [],
            retrieval: false,
            grounded: true,
            feedback: null,
            stopped: false,
            created_at: "2026-10-07T04:40:05Z",
          },
          usage: {
            budget: { session: { used: 0, limit: 1, resets_at: null }, day: { used: 0, limit: 1, resets_at: null } },
            quotas: {},
            generating: 0,
            generating_limit: 3,
          },
        })
      }),
    )
    const { user } = renderDeck()

    await user.click(screen.getByRole("button", { name: "Explain" }))

    const panel = await screen.findByRole("dialog")
    expect(await within(panel).findByText(/Light excites electrons in the thylakoids/)).toBeInTheDocument()
    expect(within(panel).getByRole("button", { name: /Source 1: Biology 10\.pdf/ })).toBeInTheDocument()
    expect(bodies).toEqual([
      {
        text: `Explain this in more detail using my sources: ${front(0)}`,
        anchor: { kind: "passages", ids: [passageId(1, 3)] },
      },
    ])
  })

  it("shows the error and asks again on request", async () => {
    let calls = 0
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/chat/messages`), () => {
        calls += 1
        return HttpResponse.json(
          { type: "notebooks/no-sources-selected", title: "No source", status: 422 },
          { status: 422, headers: { "Content-Type": "application/problem+json" } },
        )
      }),
    )
    const { user } = renderDeck()

    await user.click(screen.getByRole("button", { name: "Explain" }))
    const panel = await screen.findByRole("dialog")
    expect(await within(panel).findByRole("alert")).toHaveTextContent(/Select at least one ready source/)

    await user.click(within(panel).getByRole("button", { name: "Ask again" }))
    await waitFor(() => expect(calls).toBe(2))
  })
})
