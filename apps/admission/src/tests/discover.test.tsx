import { describe, expect, test } from "bun:test"
import { apiUrl, server, userMe } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { LogoAvatar, monogram, PhotoHeader } from "../components/lib/photo-header"
import { FactorCard } from "../features/chooser/components/chances-view"
import { ChanceChart } from "../features/chooser/components/chance-chart"
import { DiscoverPage } from "../features/discover/components/discover-page"
import type { AdmissionChanceFactor as ChanceFactor, AdmissionMatch as Match } from "@ihsp/api"
import { renderAdmissionApp } from "./helpers"

const match = (id: string, name: string): Match => ({
  university_id: id,
  name,
  city: "Boston",
  country: "US",
  logo_url: null,
  cover_url: null,
  institution_type: "private",
  admission_rate: 0.2,
  cost_after_aid_usd: 12000,
  match_pct: 87,
  overlap: { count: 2, total: 5, tags: ["vibe:urban"] },
  status: "target",
  experience: [],
  fields: ["Computer Science"],
  map_url: "https://www.google.com/maps/search/?api=1&query=Boston",
  rankings: [],
})

describe("discover swipe", () => {
  test("Interested posts the decision and Undo deletes it", async () => {
    const calls: string[] = []
    server.use(
      http.get(apiUrl("/v1/admission/matches"), () =>
        HttpResponse.json({ items: [match("u1", "Alpha College"), match("u2", "Beta College")] }),
      ),
      http.get(apiUrl("/v1/admission/preferences"), () =>
        HttpResponse.json({ answers: {}, tags: [], completed: false, updated_at: null }),
      ),
      http.post(apiUrl("/v1/admission/matches/u1/decision"), async ({ request }) => {
        calls.push(`POST ${JSON.stringify(await request.json())}`)
        return new HttpResponse(null, { status: 204 })
      }),
      http.delete(apiUrl("/v1/admission/matches/u1/decision"), () => {
        calls.push("DELETE")
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAdmissionApp(<DiscoverPage />)
    expect(await screen.findByRole("heading", { name: "Alpha College" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /^Interested/ }))
    await waitFor(() => expect(calls).toEqual(['POST {"decision":"interested"}']))
    fireEvent.click(screen.getByRole("button", { name: "Undo last decision" }))
    await waitFor(() => expect(calls).toEqual(['POST {"decision":"interested"}', "DELETE"]))
  })
})

describe("discover explainer", () => {
  test("shows on the first visit and stays dismissed", async () => {
    window.localStorage.clear()
    server.use(
      http.get(apiUrl("/v1/admission/matches"), () => HttpResponse.json({ items: [match("u1", "Alpha College")] })),
      http.get(apiUrl("/v1/admission/preferences"), () =>
        HttpResponse.json({ answers: {}, tags: [], completed: false, updated_at: null }),
      ),
    )
    renderAdmissionApp(<DiscoverPage />)
    fireEvent.click(await screen.findByRole("button", { name: "Got it" }))
    expect(screen.queryByRole("button", { name: "Got it" })).toBeNull()
    expect(window.localStorage.getItem(`admission.discover.explainer.${userMe.id}`)).toBe("1")
  })
})

describe("discover exhaustion", () => {
  test("refetches matches when the deck runs low and undo waits for the decision", async () => {
    let fetches = 0
    const { promise: gate, resolve: release } = Promise.withResolvers<void>()
    server.use(
      http.get(apiUrl("/v1/admission/matches"), () => {
        fetches += 1
        return HttpResponse.json({ items: [match("u1", "Alpha College"), match("u2", "Beta College")] })
      }),
      http.get(apiUrl("/v1/admission/preferences"), () =>
        HttpResponse.json({ answers: {}, tags: [], completed: false, updated_at: null }),
      ),
      http.post(apiUrl("/v1/admission/matches/u1/decision"), async () => {
        await gate
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAdmissionApp(<DiscoverPage />)
    expect(await screen.findByRole("heading", { name: "Alpha College" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /^Interested/ }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Undo last decision" })).toBeDisabled())
    release()
    await waitFor(() => expect(fetches).toBeGreaterThanOrEqual(2))
  })
})

describe("ChanceChart", () => {
  test("renders without a threshold or points", () => {
    const base = { your_value: 3.5, median: null, threshold: null, unit: "gpa", points: [] }
    const { container } = renderAdmissionApp(
      <ChanceChart simulation={base as unknown as Parameters<typeof ChanceChart>[0]["simulation"]} />,
    )
    expect(container.querySelector("svg")).toBeNull()
  })
})

describe("FactorCard", () => {
  test.each(["strong", "ok", "weak", "unknown"] as const)("renders the %s level", (level) => {
    const factor: ChanceFactor = {
      key: "academics",
      level,
      detail: { params: {} },
      action: level === "weak" ? { kind: "grades", href: "/profile/" } : null,
    }
    renderAdmissionApp(
      <ul>
        <FactorCard factor={factor} />
      </ul>,
    )
    expect(screen.getByTestId("factor-academics")).toHaveAttribute("data-level", level)
    expect(screen.getByText("Academics")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Improve this/ }) !== null).toBe(level === "weak")
  })
})

describe("PhotoHeader", () => {
  test("falls back to a gradient and a monogram without media", () => {
    renderAdmissionApp(<PhotoHeader name="Harvard University" title="Harvard University" />)
    expect(screen.queryByTestId("photo-header-cover")).toBeNull()
    expect(screen.getByText(monogram("Harvard University"))).toBeInTheDocument()
  })
  test("uses the cover when given", () => {
    renderAdmissionApp(<PhotoHeader name="X" title="X" coverUrl="https://example.com/c.jpg" />)
    expect(screen.getByTestId("photo-header-cover").style.backgroundImage).toContain("https://example.com/c.jpg")
  })
  test("escapes quotes and parentheses in the cover url", () => {
    renderAdmissionApp(<PhotoHeader name="X" title="X" coverUrl="https://example.com/a b.jpg" />)
    const bg = screen.getByTestId("photo-header-cover").style.backgroundImage
    expect(bg).toContain("a%20b.jpg")
  })
  test("monogram takes initials", () => {
    expect(monogram("Harvard University")).toBe(monogram("Harvard University").toUpperCase())
    renderAdmissionApp(<LogoAvatar name="Yale" />)
  })
})
