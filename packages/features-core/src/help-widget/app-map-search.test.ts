import { describe, expect, it } from "bun:test"
import { appMapItems } from "@ihsp/test-utils"
import { appMapTitle, filterAppMap, quickLinks } from "./app-map-search"

describe("filterAppMap", () => {
  it("finds pages by a title word in any language", () => {
    const [first] = appMapItems
    expect(first).toBeDefined()
    const ruWord = (first?.title.ru ?? "").split(" ")[0] ?? ""
    expect(filterAppMap(appMapItems, ruWord, "en").map((item) => item.id)).toContain(first?.id)
  })

  it("finds pages by keyword and drops the rest", () => {
    const item = appMapItems.find((entry) => entry.keywords.length > 0)
    const keyword = item?.keywords[0] ?? ""
    const found = filterAppMap(appMapItems, keyword, "en")
    expect(found.map((entry) => entry.id)).toContain(item?.id ?? "")
    expect(filterAppMap(appMapItems, "zzzz-nothing", "en")).toEqual([])
    expect(found.length).toBeLessThanOrEqual(appMapItems.length)
  })

  it("returns nothing for an empty query and requires every word", () => {
    expect(filterAppMap(appMapItems, "   ", "en")).toEqual([])
    expect(filterAppMap(appMapItems, "grades zzzz", "en")).toEqual([])
  })

  it("offers the current app's pages as quick links, never bot commands", () => {
    const links = quickLinks(appMapItems, "sp")
    expect(links.every((item) => item.app === "sp" && item.url !== null)).toBe(true)
    expect(appMapTitle(appMapItems[0]!, "uz")).toBeTruthy()
  })
})
