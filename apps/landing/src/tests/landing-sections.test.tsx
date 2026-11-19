/** The middle sections of the landing page, one block per section (LND-S1..S8). */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { I18nTestProvider } from "@ihsp/i18n"
import { TEST_ENV } from "@ihsp/test-utils"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
  type BoundFunctions,
  type queries,
} from "@testing-library/react"
import { LANDING_MESSAGES } from "../app/providers"
import { ACCORDION_MS, ACCORDION_TICK_MS } from "../features/landing/feature-accordion"
import { LandingPage } from "../features/landing/landing-page"

const realMatchMedia = window.matchMedia
const realSetInterval = globalThis.setInterval
const realClearInterval = globalThis.clearInterval

function mockMatchMedia(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

/** Collects the accordion's progress timer so a test can tick it by hand instead of waiting six seconds. */
const ticks = new Map<number, () => void>()
function captureAccordionTimer() {
  let next = 1
  globalThis.setInterval = ((handler: () => void, delay?: number, ...rest: unknown[]) => {
    if (delay !== ACCORDION_TICK_MS) return (realSetInterval as (...a: unknown[]) => unknown)(handler, delay, ...rest)
    const id = -next++
    ticks.set(id, handler)
    return id
  }) as unknown as typeof setInterval
  globalThis.clearInterval = ((id?: number) => {
    if (typeof id === "number" && id < 0) ticks.delete(id)
    else realClearInterval(id as never)
  }) as typeof clearInterval
}
function tick(times: number) {
  for (let i = 0; i < times; i++) act(() => [...ticks.values()].forEach((run) => run()))
}

function renderLanding(lang: keyof typeof LANDING_MESSAGES = "en") {
  const view = render(
    <I18nTestProvider messages={LANDING_MESSAGES[lang]}>
      <LandingPage />
    </I18nTestProvider>,
  )
  const section = (id: string) => within(view.container.querySelector(`main #${id}`) as HTMLElement)
  return { ...view, section }
}

beforeEach(() => {
  ticks.clear()
  mockMatchMedia(false)
})

afterEach(() => {
  window.matchMedia = realMatchMedia
  globalThis.setInterval = realSetInterval
  globalThis.clearInterval = realClearInterval
  window.__ENV__ = { ...TEST_ENV }
  resetConfig()
})

describe("PillCloud", () => {
  test("LND-S1 lists six everyday actions as a labelled list", () => {
    const { section } = renderLanding()
    const actions = section("actions")
    const list = actions.getByRole("list", { name: "Things you do in a few taps" })
    const items = within(list).getAllByRole("listitem")
    expect(items).toHaveLength(6)
    expect(items.map((li) => li.textContent)).toContain("Check my marks")
    expect(actions.getByRole("heading", { level: 2 }).textContent).toBe("Ask less, get to it faster")
  })
})

describe("FeatureAccordion", () => {
  function tabs(section: (id: string) => BoundFunctions<typeof queries>) {
    return section("features")
      .getAllByRole("button")
      .filter((b) => b.hasAttribute("aria-controls"))
  }

  test("LND-S2 opens one item at a time and activates it from the keyboard", () => {
    const { section } = renderLanding()
    const buttons = tabs(section)
    expect(buttons).toHaveLength(5)
    expect(buttons.map((b) => b.getAttribute("aria-expanded"))).toEqual(["true", "false", "false", "false", "false"])
    buttons[0]!.focus()
    fireEvent.keyDown(buttons[0]!, { key: "ArrowDown" })
    expect(buttons.map((b) => b.getAttribute("aria-expanded"))).toEqual(["false", "true", "false", "false", "false"])
    expect(document.activeElement).toBe(buttons[1])
    fireEvent.keyDown(buttons[1]!, { key: "End" })
    expect(buttons[4]!.getAttribute("aria-expanded")).toBe("true")
    fireEvent.click(buttons[2]!)
    expect(buttons[2]!.getAttribute("aria-expanded")).toBe("true")
    expect(buttons[4]!.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(section("features").getByRole("button", { name: "Next feature" }))
    expect(buttons[3]!.getAttribute("aria-expanded")).toBe("true")
  })

  test("LND-S2 advances by itself after ACCORDION_MS and pauses while focus is inside", async () => {
    captureAccordionTimer()
    const { section } = renderLanding()
    const buttons = tabs(section)
    await waitFor(() => expect(ticks.size).toBe(1))
    tick(ACCORDION_MS / ACCORDION_TICK_MS + 1)
    expect(buttons[1]!.getAttribute("aria-expanded")).toBe("true")

    act(() => buttons[1]!.focus())
    await waitFor(() => expect(ticks.size).toBe(0))
    tick(ACCORDION_MS / ACCORDION_TICK_MS + 1)
    expect(buttons[1]!.getAttribute("aria-expanded")).toBe("true")

    act(() => buttons[1]!.blur())
    await waitFor(() => expect(ticks.size).toBe(1))
  })

  test("LND-S2 does not auto-advance when motion is reduced", async () => {
    mockMatchMedia(true)
    captureAccordionTimer()
    const { section } = renderLanding()
    await act(async () => {})
    expect(ticks.size).toBe(0)
    expect(tabs(section)[0]!.getAttribute("aria-expanded")).toBe("true")
  })
})

describe("AppBento", () => {
  test("LND-S3 shows one card per app with what to do there", () => {
    const { section } = renderLanding()
    const apps = section("apps")
    expect(apps.getAllByRole("listitem").length).toBeGreaterThanOrEqual(8 * 4)
    expect(apps.getByText("See today’s lessons")).toBeTruthy()
  })

  test("LND-S3 cards link to the apps once the runtime config is read", async () => {
    const { section } = renderLanding()
    const apps = section("apps")
    await waitFor(() => {
      const hrefs = apps.getAllByRole("link").map((a) => a.getAttribute("href"))
      expect(hrefs).toEqual(
        expect.arrayContaining([
          `${TEST_ENV.SP_URL}/`,
          `${TEST_ENV.STAFF_URL}/`,
          `${TEST_ENV.LMS_URL}/`,
          `${TEST_ENV.LIBRARY_URL}/`,
          `${TEST_ENV.ADMISSION_URL}/`,
          `${TEST_ENV.SHARE_URL}/`,
          `${TEST_ENV.ADMIN_URL}/`,
          `${TEST_ENV.ID_URL}/`,
        ]),
      )
    })
    for (const link of apps.getAllByRole("link")) expect(link.getAttribute("aria-label")).toMatch(/^Open /)
  })
})

describe("IntegrationOrbit", () => {
  test("LND-S4 names 24 parts of the platform in a plain list", () => {
    const { section } = renderLanding()
    const list = section("integrations").getByRole("list", { name: "Connected services and features" })
    const items = within(list).getAllByRole("listitem")
    expect(items).toHaveLength(24)
    expect(items.map((li) => li.textContent)).toEqual(expect.arrayContaining(["Telegram bot", "MCP servers"]))
  })

  test("LND-S4 keeps the same list when motion is reduced", async () => {
    mockMatchMedia(true)
    const { section } = renderLanding()
    await act(async () => {})
    expect(within(section("integrations").getByRole("list")).getAllByRole("listitem")).toHaveLength(24)
  })
})

describe("Split sections", () => {
  test("LND-S5 the insight section has three points and the journal screen", () => {
    const { section } = renderLanding()
    const insight = section("insight")
    expect(insight.getByRole("heading", { level: 2 }).textContent).toBe("Your classes. In sight.")
    expect(insight.getAllByText("Marks").length).toBeGreaterThan(0)
    expect(
      insight.getByRole("img", { name: "The teacher journal with marks, attendance and homework status" }),
    ).toBeTruthy()
  })

  test("LND-S5 the control section is a labelled example of permissions and the call log", () => {
    const { section } = renderLanding()
    const control = section("control")
    expect(control.getByRole("heading", { level: 2 }).textContent).toBe("You stay in control.")
    const panel = control.getByRole("group", { name: "Example of assistant connector permissions and call log" })
    expect(within(panel).getByText("Example")).toBeTruthy()
    expect(within(panel).getByText("Timetable: read")).toBeTruthy()
    expect(within(panel).getAllByText("On").length).toBeGreaterThan(0)
    expect(within(panel).getAllByText("Off").length).toBeGreaterThan(0)
  })
})

describe("Testimonials", () => {
  test("LND-S6 are example conversations by role, labelled as examples", () => {
    const { section } = renderLanding()
    const voices = section("voices")
    expect(voices.getByText("Illustrative examples, not real messages.")).toBeTruthy()
    const list = voices.getByRole("list", { name: "Example conversations" })
    const cards = within(list).getAllByRole("figure")
    expect(cards).toHaveLength(4)
    for (const role of ["Student", "Teacher", "Librarian", "Administrator"]) {
      expect(within(list).getByText(role)).toBeTruthy()
    }
    for (const card of cards) {
      expect(within(card).getByText("Example conversation")).toBeTruthy()
      expect(card.textContent).not.toMatch(/\d+\s?%|“|”/)
    }
  })
})

describe("SetupSteps", () => {
  test("LND-S7 shows three numbered steps in order", () => {
    const { section } = renderLanding()
    const start = section("start")
    const steps = within(start.getByRole("list")).getAllByRole("listitem")
    expect(steps).toHaveLength(3)
    expect(within(steps[0]!).getByText("Step 1")).toBeTruthy()
    expect(within(steps[2]!).getByText("Step 3")).toBeTruthy()
    expect(within(steps[0]!).getByRole("heading", { level: 3 }).textContent).toBe("Sign in")
  })
})

describe("Faq", () => {
  test("LND-S8 answers open one at a time with aria-expanded", () => {
    const { section } = renderLanding()
    const faq = section("faq")
    const buttons = faq.getAllByRole("button")
    expect(buttons).toHaveLength(6)
    expect(buttons.every((b) => b.getAttribute("aria-expanded") === "false")).toBe(true)
    fireEvent.click(buttons[0]!)
    expect(buttons[0]!.getAttribute("aria-expanded")).toBe("true")
    const panel = document.getElementById(buttons[0]!.getAttribute("aria-controls")!)!
    expect(panel.getAttribute("data-open")).toBe("true")
    expect(within(panel).getByText(/Students, teachers, administrators/)).toBeTruthy()
    fireEvent.click(buttons[1]!)
    expect(buttons[0]!.getAttribute("aria-expanded")).toBe("false")
    expect(buttons[1]!.getAttribute("aria-expanded")).toBe("true")
    fireEvent.click(buttons[1]!)
    expect(buttons[1]!.getAttribute("aria-expanded")).toBe("false")
  })

  test("LND-S8 shows the support contact from the runtime config after mount", async () => {
    window.__ENV__ = { ...TEST_ENV, SECURITY_CONTACT: "help@example.org" }
    resetConfig()
    const { section } = renderLanding()
    const link = await waitFor(() => section("faq").getByRole("link", { name: "help@example.org" }))
    expect(link.getAttribute("href")).toBe("mailto:help@example.org")
  })
})

describe("Sections in other locales", () => {
  test.each(["ru", "uz"] as const)("LND-S8 the FAQ renders six questions in %s", (lang) => {
    const { section } = renderLanding(lang)
    expect(section("faq").getAllByRole("button")).toHaveLength(6)
    expect(screen.queryByText(/landing\./)).toBeNull()
  })
})
