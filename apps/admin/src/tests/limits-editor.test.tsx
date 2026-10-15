/** Limits editor, user extensions and the limits helpers (the page around them is tested in limits.test.tsx). */
import { describe, expect, spyOn, test } from "bun:test"
import type { LimitItem } from "@ihsp/api"
import { adminLimits, apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { toast } from "sonner"
import { ExtensionsSection } from "../features/limits/components/extensions-section"
import { changesOf, LimitsEditor } from "../features/limits/components/limits-editor"
import { addDays, compact, number, rangeOf, todayIso, tokens, usd } from "../features/limits/utils"
import { configureTests, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

describe("limits helpers", () => {
  test("today is the Tashkent date, which is ahead of UTC late in the evening", () => {
    expect(todayIso(new Date("2026-10-11T20:30:00Z"))).toBe("2026-10-12")
    expect(todayIso(new Date("2026-10-11T10:00:00Z"))).toBe("2026-10-11")
  })

  test("days are added across month and year ends", () => {
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30")
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29")
  })

  test("a range ends today; a week is seven days including today; a month starts on the 1st", () => {
    expect(rangeOf("7", "2026-10-11")).toEqual({ from: "2026-10-05", to: "2026-10-11" })
    expect(rangeOf("90", "2026-10-11")).toEqual({ from: "2026-07-14", to: "2026-10-11" })
    expect(rangeOf("month", "2026-10-11")).toEqual({ from: "2026-10-01", to: "2026-10-11" })
  })

  test("money is finer below a dollar", () => {
    expect(usd(0)).toBe("$0.00")
    expect(usd(0.0123)).toBe("$0.0123")
    expect(usd(1234.5)).toBe("$1,234.50")
  })

  test("counts are compact only from ten thousand", () => {
    expect(compact(9_999)).toBe("9,999")
    expect(compact(12_000)).toBe("12K")
    expect(compact(3_400_000)).toBe("3.4M")
    expect(number(600_000)).toBe("600,000")
    expect(number(null)).toBe("—")
  })

  test("the formats follow the admin's locale", () => {
    expect(number(600_000, "ru")).toBe(new Intl.NumberFormat("ru").format(600_000))
    expect(number(600_000, "ru")).not.toContain(",")
    expect(usd(1234.5, "ru")).toContain("1")
    expect(usd(1234.5, "ru")).not.toBe("$1,234.50")
    expect(compact(12_000, "ru")).toBe(new Intl.NumberFormat("ru", { notation: "compact" }).format(12_000))
    expect(tokens({ tokens_in: 120, tokens_out: 30 })).toBe(150)
  })
})

describe("changesOf", () => {
  const [tokensLimit, hours] = adminLimits as [LimitItem, LimitItem]
  const overridden: LimitItem = { ...hours, value: 8, overridden: true }
  const invalid = (item: LimitItem) => `bad ${item.key}`

  test("a value equal to the one in force changes nothing", () => {
    const result = changesOf([tokensLimit, hours], { [tokensLimit.key]: "600000", [hours.key]: "5" }, invalid)
    expect(result).toEqual({ body: { limits: {} }, errors: {} })
  })

  test("a changed value is a change, surrounding spaces are ignored", () => {
    const result = changesOf([tokensLimit], { [tokensLimit.key]: " 700000 " }, invalid)
    expect(result.body.limits).toEqual({ [tokensLimit.key]: 700000 })
  })

  test("an empty field resets an overridden limit but leaves a default one alone", () => {
    const result = changesOf([tokensLimit, overridden], { [tokensLimit.key]: "", [overridden.key]: "" }, invalid)
    expect(result.body.limits).toEqual({ [overridden.key]: null })
  })

  test("text, decimals, negatives and out-of-range values are errors for that field only", () => {
    const result = changesOf([tokensLimit, hours], { [tokensLimit.key]: "12.5", [hours.key]: "721" }, invalid)
    expect(result.errors).toEqual({ [tokensLimit.key]: `bad ${tokensLimit.key}`, [hours.key]: `bad ${hours.key}` })
    expect(result.body.limits).toEqual({})
    expect(changesOf([hours], { [hours.key]: "0" }, invalid).errors).toEqual({ [hours.key]: `bad ${hours.key}` })
    expect(changesOf([hours], { [hours.key]: "-1" }, invalid).errors).toEqual({ [hours.key]: `bad ${hours.key}` })
  })

  test("minus one is no cap only for a limit that allows it, and it is sent as -1", () => {
    const result = changesOf([tokensLimit], { [tokensLimit.key]: "-1" }, invalid)
    expect(result).toEqual({ body: { limits: { [tokensLimit.key]: -1 } }, errors: {} })
    expect(changesOf([hours], { [hours.key]: "-1" }, invalid).errors).not.toEqual({})
  })
})

describe("limits editor", () => {
  test("nothing is saved while nothing has changed", async () => {
    renderAdmin(<LimitsEditor />, { route: "/limits/" })

    expect(await screen.findByText("Nothing to save")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
  })

  test("a value outside the range is refused with the range and nothing is sent", async () => {
    let sent = false
    server.use(
      http.put(apiUrl("/v1/admin/ai/limits"), () => {
        sent = true
        return HttpResponse.json({ limits: adminLimits })
      }),
    )
    renderAdmin(<LimitsEditor />, { route: "/limits/" })

    // A valid change elsewhere enables the button; the invalid field still blocks the whole save.
    setValue(await screen.findByLabelText("Assistant tokens per day"), "500000")
    setValue(screen.getByLabelText("Notebook questions per minute"), "999999")
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/^Enter a whole number from 0 to 100\W?000\.$/)
    expect(screen.getByLabelText("Notebook questions per minute")).toHaveAttribute("aria-invalid", "true")
    expect(sent).toBe(false)
  })

  test("the unlimited toggle disables the field and saves -1; other limits have no toggle", async () => {
    let body: unknown
    server.use(
      http.put(apiUrl("/v1/admin/ai/limits"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ limits: adminLimits })
      }),
    )
    renderAdmin(<LimitsEditor />, { route: "/limits/" })
    const tokens = (await screen.findByLabelText("Assistant tokens per day")).closest("li") as HTMLElement
    const hours = screen.getByLabelText("Session length").closest("li") as HTMLElement
    expect(within(hours).queryByLabelText("Unlimited")).toBeNull()

    fireEvent.click(within(tokens).getByLabelText("Unlimited"))
    expect(screen.getByLabelText("Assistant tokens per day")).toBeDisabled()
    expect(screen.getByLabelText("Assistant tokens per day")).toHaveValue("∞")
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitUntil(() => body !== undefined, "no save")
    expect(body).toEqual({ limits: { ai_daily_tokens_student: -1 } })
  })

  test("a changed value is sent alone as an integer", async () => {
    let body: unknown
    server.use(
      http.put(apiUrl("/v1/admin/ai/limits"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ limits: adminLimits })
      }),
    )
    renderAdmin(<LimitsEditor />, { route: "/limits/" })
    const field = await screen.findByLabelText("Notebook questions per minute")
    setValue(field, "25")
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
    await waitUntil(() => body !== undefined, "no save")
    expect(body).toEqual({ limits: { nb_chat_per_minute: 25 } })
  })

  test("a rejected save shows the failure inline, not as a toast, and keeps the typed value", async () => {
    server.use(
      http.put(apiUrl("/v1/admin/ai/limits"), () =>
        HttpResponse.json(
          { type: "admin/limit-invalid", title: "Invalid limit value.", status: 422 },
          { status: 422, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const error = spyOn(toast, "error").mockImplementation(() => "")
    renderAdmin(<LimitsEditor />, { route: "/limits/" })
    const field = await screen.findByLabelText("Notebook questions per minute")
    setValue(field, "25")

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(await screen.findByText("The limits could not be saved")).toBeInTheDocument()
    expect(error).not.toHaveBeenCalled()
    expect(field).toHaveValue("25")
    error.mockRestore()
  })
})

describe("user extensions", () => {
  test("an existing extension shows its grant, its end date and its note, and can be removed after a confirmation", async () => {
    let removed: string | undefined
    server.use(
      http.delete(apiUrl("/v1/admin/ai/limit-extensions/:id"), ({ params }) => {
        removed = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderAdmin(<ExtensionsSection />, { route: "/limits/" })

    expect(await screen.findByText("Bobur Rashidov")).toBeInTheDocument()
    expect(screen.getByText("×3 · until 2026-12-31 · Thesis")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Remove" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Remove the extension of Bobur Rashidov?")).toBeInTheDocument()
    expect(removed).toBeUndefined()
    await user.click(within(dialog).getByRole("button", { name: "Remove" }))

    await waitUntil(() => removed !== undefined, "no delete request")
    expect(removed).toBe("01a1276c-6b4c-73e1-8076-000000000102")
  })

  test("with no extensions the list says so", async () => {
    server.use(http.get(apiUrl("/v1/admin/ai/limit-extensions"), () => HttpResponse.json({ items: [] })))
    renderAdmin(<ExtensionsSection />, { route: "/limits/" })

    expect(await screen.findByText("No extensions yet.")).toBeInTheDocument()
  })

  test("a search without a match says no students were found", async () => {
    const { user } = renderAdmin(<ExtensionsSection />, { route: "/limits/" })
    await user.click(await screen.findByRole("button", { name: "Add extension" }))

    setValue(await screen.findByLabelText("Name or login (2+ letters)"), "Zzz")

    expect(await screen.findByText("No students found.")).toBeInTheDocument()
  })

  test("fixed values need at least one number; the others are sent with the date and a trimmed note", async () => {
    let body: unknown
    server.use(
      http.put(apiUrl("/v1/admin/ai/limit-extensions/:id"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({})
      }),
    )
    const { user } = renderAdmin(<ExtensionsSection />, { route: "/limits/" })
    await user.click(await screen.findByRole("button", { name: "Add extension" }))
    setValue(await screen.findByLabelText("Name or login (2+ letters)"), "Aziz")
    await user.click(await screen.findByRole("button", { name: /Aziza Karimova/ }))
    const dialog = screen.getByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Fixed values" }))

    await user.click(within(dialog).getByRole("button", { name: "Save extension" }))
    expect(await within(dialog).findByText("Choose a multiplier or set at least one value.")).toBeInTheDocument()
    expect(body).toBeUndefined()

    setValue(await within(dialog).findByLabelText("nb_chat_per_minute"), "40")
    setValue(within(dialog).getByLabelText("ai_session_hours"), "abc")
    setValue(within(dialog).getByLabelText("Valid until (optional)"), "2026-12-01")
    setValue(within(dialog).getByLabelText("Note (why, for how long)"), "  Thesis week  ")
    await user.click(within(dialog).getByRole("button", { name: "Save extension" }))

    await waitUntil(() => body !== undefined, "no save")
    expect(body).toEqual({
      multiplier: null,
      values: { nb_chat_per_minute: 40 },
      expires_on: "2026-12-01",
      note: "Thesis week",
    })
  })
})
