import { describe, expect, test } from "bun:test"
import { toCsv, toTsv } from "./csv"

describe("toCsv", () => {
  test("starts with a BOM so spreadsheets read UTF-8", () => {
    expect(toCsv([["a"]]).startsWith("﻿")).toBe(true)
  })

  test("quotes fields with commas, quotes and line breaks", () => {
    const csv = toCsv([["plain", "a,b", 'say "hi"', "two\nlines"]], { bom: false })

    expect(csv).toBe('plain,"a,b","say ""hi""","two\nlines"')
  })

  test("joins rows with CRLF and keeps Cyrillic", () => {
    expect(
      toCsv(
        [
          ["Вопрос", "Ответ"],
          ["1", "2"],
        ],
        { bom: false },
      ),
    ).toBe("Вопрос,Ответ\r\n1,2")
  })

  test("an empty table gives an empty body", () => {
    expect(toCsv([], { bom: false })).toBe("")
  })
})

describe("toTsv", () => {
  test("separates cells with tabs and flattens tabs and line breaks inside cells", () => {
    expect(
      toTsv([
        ["a", "b\tc"],
        ["d\ne", "f"],
      ]),
    ).toBe("a\tb c\nd e\tf")
  })
})
