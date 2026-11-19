import { apiUrl, ids, server } from "@ihsp/test-utils"
import { cleanup, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { ASSISTANT_PREFILL_EVENT, StartHereCard, startHereKey } from "./components/start-here-card"

function serve(list: unknown[], majorScore: number) {
  server.use(
    http.get(apiUrl("/v1/admission/list"), () => HttpResponse.json(list)),
    http.get(apiUrl("/v1/admission/readiness"), () =>
      HttpResponse.json({
        percent: 0,
        components: [{ key: "major", score: majorScore, weight: 10, next_action: null, url_path: null }],
      }),
    ),
  )
}

const show = () =>
  renderAdmissionApp(<StartHereCard />, {
    messages: { home: { startHere: { quiz: { label: "Take the 10-minute quiz", hint: "Find fields that fit you" } } } },
  })

beforeEach(() => window.localStorage.clear())
afterEach(cleanup)

describe("start here card", () => {
  test("ADM-UNDEC-2: shows for a student with no list and no field, with links to existing routes", async () => {
    serve([], 0)
    show()
    expect(await screen.findByText("Start here")).toBeTruthy()
    const href = (name: string) => screen.getByRole("link", { name: new RegExp(name) }).getAttribute("href")
    expect(href("Take the career quiz")).toBe("/career")
    expect(href("Explore opportunities")).toBe("/opportunities")
    expect(href("Browse courses")).toBe("/courses")
    expect(href("How applying works")).toBe("/faq")
    expect(href("Follow the journey")).toBe("/#journey")
  })

  test("pathway: the quiz suggestion links to the explore tab of the career page", async () => {
    serve([], 0)
    show()
    const link = await screen.findByRole("link", { name: /Take the 10-minute quiz/ })
    expect(link.getAttribute("href")).toBe("/career?tab=explore")
  })

  test("ADM-UNDEC-3: hidden when a list item exists", async () => {
    serve([{ id: "l1", bucket: "reach", institution: { name: "X", facts: {} } }], 0)
    show()
    await waitFor(() => expect(screen.queryByText("Start here")).toBeNull())
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(screen.queryByText("Start here")).toBeNull()
  })

  test("ADM-UNDEC-4: hidden when a field of study is chosen", async () => {
    serve([], 100)
    show()
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(screen.queryByText("Start here")).toBeNull()
  })

  test("ADM-UNDEC-5: dismissal is stored per user id and can be undone", async () => {
    serve([], 0)
    const { user } = show()
    await user.click(await screen.findByRole("button", { name: "Hide the start guide" }))
    const keys = Object.keys(window.localStorage).filter((key) => key.startsWith("ihsp:admission:start-here"))
    expect(keys).toEqual([startHereKey(ids.student)])
    expect(screen.queryByText("Start here")).toBeNull()
    await user.click(screen.getByRole("button", { name: "Show the start guide" }))
    expect(await screen.findByText("Start here")).toBeTruthy()
    expect(window.localStorage.length).toBe(0)
  })

  test("ADM-UNDEC-6: the assistant step passes the starter prompt", async () => {
    serve([], 0)
    const received: string[] = []
    const listener = (event: Event) => received.push((event as CustomEvent<{ text: string }>).detail.text)
    window.addEventListener(ASSISTANT_PREFILL_EVENT, listener)
    const { user } = show()
    await user.click(await screen.findByRole("button", { name: /Ask the assistant/ }))
    window.removeEventListener(ASSISTANT_PREFILL_EVENT, listener)
    expect(received).toEqual(["I don't know what to do"])
  })
})
