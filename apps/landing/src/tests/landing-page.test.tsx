/** The landing page: hero, section order, header and footer navigation, dialogs, reduced motion and the runtime links. */
import { afterEach, describe, expect, test } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { I18nTestProvider } from "@ihsp/i18n"
import { TEST_ENV } from "@ihsp/test-utils"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { LANDING_MESSAGES } from "../app/providers"
import { LandingPage } from "../features/landing/landing-page"
import { botUrl } from "../features/landing/links"

type Lang = keyof typeof LANDING_MESSAGES

function renderLanding(lang: Lang = "en") {
  return render(
    <I18nTestProvider messages={LANDING_MESSAGES[lang]}>
      <LandingPage />
    </I18nTestProvider>,
  )
}

afterEach(() => {
  window.__ENV__ = { ...TEST_ENV }
  resetConfig()
})

const SECTION_IDS = [
  "top",
  "actions",
  "features",
  "apps",
  "integrations",
  "insight",
  "control",
  "voices",
  "start",
  "faq",
  "join",
]

describe("LandingPage", () => {
  test("LND-1 renders the hero, the CTAs and the footer contacts", async () => {
    window.__ENV__ = { ...TEST_ENV, BOT_USERNAME: "ihtbot", SECURITY_CONTACT: "sec@example.org, @sec_team (Telegram)" }
    resetConfig()
    renderLanding()

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Your school day, answered in a chat")
    expect(screen.getAllByRole("img", { name: "Interhouse logo" }).length).toBeGreaterThan(0)
    const bots = screen.getAllByRole("link", { name: "Open the Telegram bot" })
    await waitFor(() => expect(bots[0]?.getAttribute("href")).toBe("https://t.me/ihtbot"))
    const open = screen.getAllByRole("link").filter((a) => a.getAttribute("href") === `${TEST_ENV.SP_URL}/`)
    expect(open.length).toBeGreaterThan(2)
    const footer = within(screen.getByRole("contentinfo"))
    expect(footer.getByRole("link", { name: "sec@example.org" }).getAttribute("href")).toBe("mailto:sec@example.org")
    expect(footer.getByRole("link", { name: "@sec_team" }).getAttribute("href")).toBe("https://t.me/sec_team")
    expect(footer.getByRole("link", { name: "@ihtsupport" }).getAttribute("href")).toBe("https://t.me/ihtsupport")
  })

  test("LND-2 the sections come in order and the header anchors point at existing ids", () => {
    const { container } = renderLanding()
    const ids = SECTION_IDS.map((id) => container.querySelector(`main #${id}`))
    ids.forEach((node, index) => expect(node, SECTION_IDS[index]).not.toBeNull())
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i - 1]!.compareDocumentPosition(ids[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
    const header = container.querySelector("header")!
    const anchors = within(header)
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.startsWith("#"))
    expect(anchors.length).toBeGreaterThan(4)
    for (const a of anchors) {
      expect(container.querySelector(a.getAttribute("href")!), a.getAttribute("href")!).not.toBeNull()
    }
    expect(screen.getByRole("contentinfo")).toBeTruthy()
  })

  test("LND-3 the mobile menu opens from the burger and closes with Escape", () => {
    renderLanding()
    const burger = screen.getByRole("button", { name: "Menu" })
    expect(burger.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(burger)
    expect(burger.getAttribute("aria-expanded")).toBe("true")
    fireEvent.keyDown(document, { key: "Escape" })
    expect(burger.getAttribute("aria-expanded")).toBe("false")
  })

  test("LND-4 the principles dialog opens from the footer and closes with the button and with Escape", () => {
    renderLanding()
    expect(screen.queryByRole("dialog", { name: "Principles" })).toBeNull()
    fireEvent.click(within(screen.getByRole("contentinfo")).getByRole("button", { name: "Principles" }))
    const dialog = screen.getByRole("dialog", { name: "Principles" })
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(5)
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }))
    expect(screen.queryByRole("dialog", { name: "Principles" })).toBeNull()
    fireEvent.click(within(screen.getByRole("contentinfo")).getByRole("button", { name: "Principles" }))
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByRole("dialog", { name: "Principles" })).toBeNull()
  })

  test("LND-5 the example chat shows the finished conversation when motion is reduced", async () => {
    const original = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    })) as typeof window.matchMedia
    try {
      renderLanding()
      const chat = screen.getByRole("group", { name: "Example conversation with the assistant" })
      await waitFor(() => expect(chat.getAttribute("data-step")).toBe("6"))
      expect(within(chat).getByText("Based on 4 sources").getAttribute("data-on")).toBe("true")
    } finally {
      window.matchMedia = original
    }
  })

  test.each(["en", "ru", "uz"] as const)("LND-6 renders in %s without raw keys", (lang) => {
    const { container } = renderLanding(lang)
    expect(container.textContent).not.toMatch(/landing\./)
    expect(screen.getByRole("heading", { level: 1 }).textContent?.length).toBeGreaterThan(5)
  })

  test("LND-7 hides the security contact when it is empty", () => {
    window.__ENV__ = { ...TEST_ENV, SECURITY_CONTACT: "" }
    resetConfig()
    renderLanding()
    expect(screen.queryByText(/Security contact/)).toBeNull()
  })

  test("LND-8 botUrl drops a leading @", () => {
    expect(botUrl("@ihspbot")).toBe("https://t.me/ihspbot")
  })
})
