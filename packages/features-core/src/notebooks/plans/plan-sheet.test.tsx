import { describe, expect, it } from "bun:test"
import type { PlanUpdateBody, PresentationPlan } from "@ihsp/api"
import { apiUrl, artifactSlides, nbIds, problem, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { ActionCard } from "../chat/action-card"
import { PlanCard } from "./plan-card"

allowSlowRenders()

const PLANS = `/v1/notebooks/${nbIds.notebook}/presentation-plans`

const plan = (overrides: Partial<PresentationPlan> = {}): PresentationPlan => ({
  id: "plan-1",
  notebook_id: nbIds.notebook,
  title: "Photosynthesis",
  slides: [
    { title: "Photosynthesis", bullets: ["What it is", "Why it matters"] },
    { title: "Light reactions", bullets: ["Chlorophyll", "ATP"] },
    { title: "Calvin cycle", bullets: ["CO2 fixation"] },
    { title: "Key takeaways", bullets: ["Light to sugar"] },
  ],
  status: "draft",
  max_slides: 18,
  over_limit: false,
  artifact_id: null,
  created_at: "2026-10-14T09:00:00Z",
  updated_at: "2026-10-14T09:00:00Z",
  ...overrides,
})

function serve(initial: PresentationPlan) {
  let current = initial
  const saved: PlanUpdateBody[] = []
  const confirmed: string[] = []
  server.use(
    http.get(apiUrl(`${PLANS}/${initial.id}`), () => HttpResponse.json(current)),
    http.patch(apiUrl(`${PLANS}/${initial.id}`), async ({ request }) => {
      const body = (await request.json()) as PlanUpdateBody
      saved.push(body)
      current = {
        ...current,
        title: body.title ?? current.title,
        slides: body.slides ?? current.slides,
        updated_at: `2026-10-14T09:0${saved.length}:00Z`,
      }
      return HttpResponse.json(current)
    }),
    http.post(apiUrl(`${PLANS}/${initial.id}/confirm`), () => {
      confirmed.push(current.id)
      current = { ...current, status: "confirmed", artifact_id: artifactSlides.id, updated_at: "2026-10-14T10:00:00Z" }
      return HttpResponse.json({ plan: current, artifact: { ...artifactSlides, status: "queued" } }, { status: 202 })
    }),
  )
  return { saved, confirmed }
}

describe("PLAN PlanCard and PlanSheet", () => {
  it("shows the outline card and opens the panel with numbered, editable slides", async () => {
    serve(plan())
    const { user } = renderNotebook(<PlanCard notebookId={nbIds.notebook} plan={plan()} />)

    await user.click(screen.getByRole("button", { name: /Photosynthesis · 4-slide outline/ }))

    const sheet = await screen.findByRole("dialog", { name: "Presentation plan" })
    expect(within(sheet).getByRole("textbox", { name: "Slide 2 title" })).toHaveValue("Light reactions")
    expect(within(sheet).getByRole("textbox", { name: "Point 1 of slide 2" })).toHaveValue("Chlorophyll")
  })

  it("saves edits (renamed, deleted and moved slides) before Generate, then shows the deck is being made", async () => {
    const calls = serve(plan())
    const { user } = renderNotebook(<PlanCard notebookId={nbIds.notebook} plan={plan()} />)
    await user.click(screen.getByRole("button", { name: /4-slide outline/ }))
    const sheet = await screen.findByRole("dialog", { name: "Presentation plan" })

    const title = within(sheet).getByRole("textbox", { name: "Slide 1 title" })
    await user.clear(title)
    await user.type(title, "Intro")
    await user.click(within(sheet).getByRole("button", { name: "Delete slide 2" }))
    await user.click(within(sheet).getByRole("button", { name: "Move slide 3 up" }))
    await user.click(within(sheet).getByRole("button", { name: "Generate" }))

    await waitFor(() => expect(calls.confirmed).toEqual(["plan-1"]))
    expect(calls.saved[0]?.slides?.map((slide) => slide.title)).toEqual(["Intro", "Key takeaways", "Calvin cycle"])
    expect(await within(sheet).findByText("The deck is being generated. It will appear in Studio.")).toBeInTheDocument()
  })

  it("explains the limit and offers to trim a plan that is too long", async () => {
    const long = plan({
      max_slides: 4,
      over_limit: true,
      slides: Array.from({ length: 6 }, (_, n) => ({ title: `Slide ${n}`, bullets: ["a"] })),
    })
    serve(long)
    const { user } = renderNotebook(<PlanCard notebookId={nbIds.notebook} plan={long} />)
    await user.click(screen.getByRole("button", { name: /6-slide outline/ }))
    const sheet = await screen.findByRole("dialog", { name: "Presentation plan" })

    expect(within(sheet).getByRole("alert")).toHaveTextContent("The plan has 6 slides, but a deck can have at most 4.")
    expect(within(sheet).getByRole("button", { name: "Generate" })).toBeDisabled()
    await user.click(within(sheet).getByRole("button", { name: "Trim to 4 slides" }))

    expect(within(sheet).queryByRole("alert")).not.toBeInTheDocument()
    expect(within(sheet).getByRole("textbox", { name: "Slide 4 title" })).toHaveValue("Slide 5")
    expect(within(sheet).getByRole("button", { name: "Generate" })).toBeEnabled()
  })

  it("shows the server's refusal when Generate is over the limit", async () => {
    serve(plan())
    server.use(
      http.post(apiUrl(`${PLANS}/plan-1/confirm`), () =>
        problem(422, "notebooks/plan-too-long", "Plan too long", { params: { count: 20, max: 18 } }),
      ),
    )
    const { user } = renderNotebook(<PlanCard notebookId={nbIds.notebook} plan={plan()} />)
    await user.click(screen.getByRole("button", { name: /4-slide outline/ }))
    const sheet = await screen.findByRole("dialog", { name: "Presentation plan" })

    await user.click(within(sheet).getByRole("button", { name: "Generate" }))

    expect(await within(sheet).findByRole("alert")).toHaveTextContent("The plan has 20 slides")
  })
})

describe("PLAN ActionCard: a proposed deck is planned first", () => {
  it("asks for an outline instead of the deck and shows the plan card", async () => {
    serve(plan())
    let body: unknown = null
    server.use(
      http.post(apiUrl(PLANS), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(plan(), { status: 201 })
      }),
    )
    const { user } = renderNotebook(
      <ActionCard
        notebookId={nbIds.notebook}
        create={{ kind: "slides", options: { length: "short" }, prompt: "photosynthesis" }}
        onDismiss={() => undefined}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Plan the slides" }))

    expect(await screen.findByRole("button", { name: /Photosynthesis · 4-slide outline/ })).toBeInTheDocument()
    expect(body).toEqual({ prompt: "photosynthesis", source_ids: null })
  })
})
