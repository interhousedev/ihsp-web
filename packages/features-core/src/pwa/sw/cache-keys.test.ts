import { describe, expect, test } from "bun:test"
import { extractAssetUrls } from "./cache-keys"

describe("extractAssetUrls", () => {
  test("finds the hashed scripts, styles and fonts of a page, once each", () => {
    const html = `<script src="/_next/static/chunks/app.abc123.js"></script>
      <link href="/_next/static/css/site.css"><link href="/_next/static/media/a.woff2">
      <script src="/_next/static/chunks/app.abc123.js"></script>`
    expect(extractAssetUrls(html)).toEqual([
      "/_next/static/chunks/app.abc123.js",
      "/_next/static/css/site.css",
      "/_next/static/media/a.woff2",
    ])
  })

  test("a page of many unfinished asset prefixes with long tails is scanned quickly", () => {
    const hostile = "/_next/static/".repeat(5_000) + "a/.".repeat(100_000)
    const started = performance.now()
    expect(extractAssetUrls(hostile)).toEqual([])
    expect(performance.now() - started).toBeLessThan(2_000)
  })
})
