/** The phone bottom bar's pages: account choice, device storage, defaults and saving. */
import { beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, server, userMe } from "@ihsp/test-utils"
import { act, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { useEffect } from "react"
import { useBottomBar } from "../features/shell/hooks/use-bottom-bar"
import { DASHBOARD_MIGRATED, DEFAULT_BOTTOM_BAR, type DestinationId } from "../features/shell/utils/bottom-bar"
import { configureTests, renderSp, studentWith } from "./helpers"

configureTests()

const storageKey = `ihsp:sp:bottom-bar:v2:${userMe.id}`

beforeEach(() => window.localStorage.clear())

let save: ReturnType<typeof useBottomBar>["save"] = () => undefined

function Probe() {
  const bar = useBottomBar()
  useEffect(() => {
    save = bar.save
  }, [bar.save])
  return <p data-testid="ids">{bar.ids.join(",")}</p>
}

function recordPatches(): Record<string, unknown>[] {
  const bodies: Record<string, unknown>[] = []
  server.use(
    http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      bodies.push(body)
      return HttpResponse.json({ ...userMe.preferences, ...body })
    }),
  )
  return bodies
}

describe("useBottomBar", () => {
  test("falls back to the defaults", async () => {
    renderSp(<Probe />)
    expect((await screen.findByTestId("ids")).textContent).toBe(DEFAULT_BOTTOM_BAR.join(","))
  })

  test("uses this device's storage when the account has no choice", async () => {
    window.localStorage.setItem(storageKey, JSON.stringify(["files", "grades"]))
    renderSp(<Probe />)
    await waitFor(() => expect(screen.getByTestId("ids").textContent).toBe("files,grades"))
  })

  test("the account's choice wins over the device's", async () => {
    window.localStorage.setItem(storageKey, JSON.stringify(["files"]))
    const session = studentWith({ bottom_nav: ["exams", "links", "bogus"] })
    server.use(http.get(apiUrl("/v1/id/me"), () => HttpResponse.json(session.user)))
    renderSp(<Probe />, { session })
    await waitFor(() => expect(screen.getByTestId("ids").textContent).toBe("exams,links"))
  })

  test("save cleans the list, stores it on the device and saves it in the account", async () => {
    const bodies = recordPatches()
    renderSp(<Probe />)
    await screen.findByTestId("ids")

    // An id the app no longer knows (an old build saved it) is typed away here, as the hook must drop it.
    act(() => save(["grades", "nope", "grades", "today"] as unknown as DestinationId[]))

    await waitFor(() => expect(screen.getByTestId("ids").textContent).toBe("grades,today"))
    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "[]")).toEqual(["grades", "today"])
    await waitFor(() =>
      expect(bodies).toEqual([{ bottom_nav: ["grades", "today"], onboarding_dismissed: [DASHBOARD_MIGRATED] }]),
    )
  })
})
