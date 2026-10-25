import { describe, expect, it } from "bun:test"
import { addDays, startOfWeek, todayIso, weekDates } from "../dates"
import { formatDate, formatDateTime, formatRelative, formatTime } from "../format"
import { currentLocale, setLocale, setPreferredLocale, useLocaleStore } from "../locale-store"
import { matchLocale } from "../locales"
import { mergeMessages } from "../messages"

describe("formatters use Asia/Tashkent (UTC+5)", () => {
  it("formats the time of day in 24-hour form", () => {
    expect(formatTime("2026-10-07T09:05:00Z", "en")).toBe("14:05")
    expect(formatTime("2026-10-07T09:05:00Z", "ru")).toBe("14:05")
  })

  it("moves a late-evening UTC instant to the next day in Tashkent", () => {
    expect(formatDate("2026-10-07T20:30:00Z", "en", { day: "numeric", month: "numeric" })).toBe("08/10")
    expect(formatDateTime("2026-10-07T20:30:00Z", "en")).toContain("01:30")
  })

  it("keeps a date-only string on the same day", () => {
    expect(formatDate("2026-10-07", "en", { day: "numeric", month: "numeric", year: "numeric" })).toBe("07/10/2026")
  })

  it("writes relative times in the chosen language", () => {
    const now = Date.parse("2026-10-07T12:00:00Z")

    expect(formatRelative("2026-10-07T11:57:00Z", "en", now)).toBe("3 minutes ago")
    expect(formatRelative("2026-10-09T12:00:00Z", "en", now)).toBe("in 2 days")
  })
})

describe("date helpers", () => {
  it("todayIso returns the Tashkent date", () => {
    expect(todayIso(new Date("2026-10-07T20:30:00Z"))).toBe("2026-10-08")
  })

  it("weeks start on Monday", () => {
    expect(startOfWeek("2026-10-07")).toBe("2026-10-05")
    expect(startOfWeek("2026-10-11")).toBe("2026-10-05")
    expect(startOfWeek("2026-10-12")).toBe("2026-10-12")
    expect(weekDates("2026-10-05")).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ])
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01")
  })
})

describe("locale", () => {
  it("matches supported languages from browser tags", () => {
    expect(matchLocale("uz-UZ")).toBe("uz")
    expect(matchLocale("RU")).toBe("ru")
    expect(matchLocale("de-DE")).toBeNull()
  })

  it("account preference beats the stored choice, and an explicit choice is stored", () => {
    useLocaleStore.setState({ locale: "ru", resolved: false })

    setLocale("en")
    expect(window.localStorage.getItem("ihsp.locale")).toBe("en")
    expect(currentLocale()).toBe("en")

    setPreferredLocale("uz")
    expect(currentLocale()).toBe("uz")

    setPreferredLocale(null)
    expect(currentLocale()).toBe("uz")
  })

  it("merges app messages over the shared ones, deeply", () => {
    const merged = mergeMessages(
      { common: { save: "Save", cancel: "Cancel" } },
      { common: { save: "Store" }, home: { title: "Home" } },
    )

    expect(merged).toEqual({ common: { save: "Store", cancel: "Cancel" }, home: { title: "Home" } })
  })
})
