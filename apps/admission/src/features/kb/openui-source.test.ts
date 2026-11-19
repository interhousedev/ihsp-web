import { describe, expect, test } from "bun:test"
import { isRenderable, kbLibrary } from "@ihsp/features-core/openui"
import { appendBlock, bodyBlocks, buildSource, parseSource, validateBlock } from "./openui-source"

describe("kb openui blocks", () => {
  test("a Button block is a valid fence and parses back", () => {
    const source = buildSource("button", { label: "Pay", url: "/payments/" })
    expect(isRenderable(source, kbLibrary, "kb")).toBe(true)
    expect(appendBlock("Intro", source)).toBe(`Intro\n\n\`\`\`openui\n${source}\n\`\`\`\n`)
    expect(parseSource(source)).toEqual({ kind: "button", values: { label: "Pay", url: "/payments/" } })
  })

  test("every kind round-trips through its source", () => {
    const cases = [
      ["linkCard", { title: "T", text: "X", label: "L", url: "https://iht.uz" }],
      ["callout", { tone: "warning", title: "T", text: "X" }],
      ["steps", { title: "T", steps: "a\nb" }],
      ["card", { title: "T", text: "X" }],
    ] as const
    for (const [kind, values] of cases) {
      const source = buildSource(kind, values)
      expect(validateBlock(kind, values)).toBeNull()
      expect(parseSource(source)).toEqual({ kind, values })
    }
  })

  test("javascript:, http: and protocol-relative links are refused", () => {
    for (const url of ["javascript:alert(1)", "http://iht.uz", "//evil.uz", "data:text/html,x"]) {
      expect(validateBlock("button", { label: "x", url })).toBe("url")
    }
    expect(validateBlock("button", { label: "x", url: "mailto:a@iht.uz" })).toBeNull()
  })

  test("the chat rules stay https only", () => {
    const source = buildSource("button", { label: "Pay", url: "/payments/" })
    expect(isRenderable(source, kbLibrary, "https")).toBe(false)
  })

  test("counts blocks and flags an oversized one", () => {
    const fence = (code: string) => `\`\`\`openui\n${code}\n\`\`\``
    expect(bodyBlocks(`${fence("root = Stack([])")}\n${fence("root = Stack([])")}`)).toEqual({
      count: 2,
      tooLong: false,
    })
    expect(bodyBlocks(fence("x".repeat(6001))).tooLong).toBe(true)
  })
})
