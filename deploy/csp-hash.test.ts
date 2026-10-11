import { describe, expect, it } from "bun:test"
import { APP_DIRECTIVES, APPS, buildCspMeta, hashScript, injectCsp, inlineScriptHashes } from "./csp-hash"

// printf '%s' "console.log(1)" | openssl dgst -sha256 -binary | base64
const HASH_CONSOLE_LOG_1 = "sha256-CihokcEcBW4atb/CW/XWsvWwbTjqwQlE9nj9ii5ww5M="
// printf '%s' " x " | openssl dgst -sha256 -binary | base64
const HASH_SPACED_X = "sha256-/Bker9nFC+9O7SRNJJUp3pmA/6JARgfA+Y6sRMjadyg="

const page = (head: string) =>
  `<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/>${head}</head><body><header>h</header></body></html>`

describe("hashScript", () => {
  it("produces the known sha256 of a script body", () => {
    expect(hashScript("console.log(1)")).toBe(HASH_CONSOLE_LOG_1)
  })

  it("hashes the text exactly, whitespace included", () => {
    expect(hashScript(" x ")).toBe(HASH_SPACED_X)
    expect(hashScript(" x ")).not.toBe(hashScript("x"))
  })
})

describe("inlineScriptHashes", () => {
  it("hashes inline scripts and skips scripts with src", () => {
    const html = page('<script src="/env.js"></script><script>console.log(1)</script>')
    expect(inlineScriptHashes(html)).toEqual([`'${HASH_CONSOLE_LOG_1}'`])
  })

  it("does not trim the script body", () => {
    expect(inlineScriptHashes(page("<script> x </script>"))).toEqual([`'${HASH_SPACED_X}'`])
  })

  it("handles scripts that contain '<' and attributes", () => {
    const body = "if (1 < 2) { a = '<b>'; }"
    const html = page(`<script id="x" async>${body}</script>`)
    expect(inlineScriptHashes(html)).toEqual([`'${hashScript(body)}'`])
  })

  it("lists identical scripts once", () => {
    const html = page("<script>console.log(1)</script><script>console.log(1)</script>")
    expect(inlineScriptHashes(html)).toHaveLength(1)
  })

  it("returns nothing for a page without inline scripts", () => {
    expect(inlineScriptHashes(page('<script src="/a.js"></script>'))).toEqual([])
  })
})

describe("buildCspMeta", () => {
  it("carries script-src only (the rest is the nginx header)", () => {
    const meta = buildCspMeta([`'${HASH_CONSOLE_LOG_1}'`])
    expect(meta).toBe(
      `<meta http-equiv="Content-Security-Policy" content="script-src 'self' '${HASH_CONSOLE_LOG_1}' https://telegram.org/js/telegram-web-app.js">`,
    )
    for (const directive of ["default-src", "connect-src", "img-src", "frame-ancestors", "style-src"]) {
      expect(meta).not.toContain(directive)
    }
    expect(meta).not.toContain("unsafe-inline")
  })

  it("allows the Telegram SDK file only, not the whole telegram.org origin", () => {
    const meta = buildCspMeta([])
    expect(meta).toContain(" https://telegram.org/js/telegram-web-app.js")
    expect(meta).not.toMatch(/https:\/\/telegram\.org[" ]/)
  })
})

describe("apps", () => {
  it("hashes the exports of every app, the library included", () => {
    expect([...APPS].toSorted()).toEqual(["admin", "id", "library", "lms", "share", "sp", "staff"])
  })

  it("adds a directive to the page policy of the library only", () => {
    expect(Object.keys(APP_DIRECTIVES)).toEqual(["library"])
    expect(APP_DIRECTIVES.library).toBe("worker-src 'self' blob:")
  })
})

describe("buildCspMeta with the directives of an app", () => {
  it("appends them after script-src, so the library's PDF.js worker may start from a blob: URL", () => {
    const meta = buildCspMeta([`'${HASH_CONSOLE_LOG_1}'`], APP_DIRECTIVES.library)
    expect(meta).toBe(
      `<meta http-equiv="Content-Security-Policy" content="script-src 'self' '${HASH_CONSOLE_LOG_1}' https://telegram.org/js/telegram-web-app.js; worker-src 'self' blob:">`,
    )
  })

  it("is the plain script-src policy when the app adds nothing", () => {
    expect(buildCspMeta([`'${HASH_CONSOLE_LOG_1}'`], "")).toBe(buildCspMeta([`'${HASH_CONSOLE_LOG_1}'`]))
    expect(buildCspMeta([`'${HASH_CONSOLE_LOG_1}'`], APP_DIRECTIVES.sp)).not.toContain("worker-src")
  })
})

describe("injectCsp", () => {
  it("inserts the meta tag as the first child of <head> with the hash of the inline script", () => {
    const { html, hashCount } = injectCsp(page("<script>console.log(1)</script>"))
    expect(hashCount).toBe(1)
    expect(html).toContain(
      `<head><meta http-equiv="Content-Security-Policy" content="script-src 'self' '${HASH_CONSOLE_LOG_1}'`,
    )
    expect(html).toContain("<header>h</header>")
  })

  it("puts the directives of the app into the inserted policy", () => {
    const { html } = injectCsp(page("<script>console.log(1)</script>"), APP_DIRECTIVES.library)
    expect(html).toContain("https://telegram.org/js/telegram-web-app.js; worker-src 'self' blob:\">")
    expect(html.match(/http-equiv="Content-Security-Policy"/g)).toHaveLength(1)
  })

  it("is idempotent", () => {
    const first = injectCsp(page("<script>console.log(1)</script>"))
    const second = injectCsp(first.html)
    expect(second.hashCount).toBe(0)
    expect(second.html).toBe(first.html)
  })

  it("leaves a page without inline scripts unchanged", () => {
    const original = page('<script src="/env.js"></script>')
    const { html, hashCount } = injectCsp(original)
    expect(hashCount).toBe(0)
    expect(html).toBe(original)
  })

  it("does not break on '$' in script bodies", () => {
    const { html } = injectCsp(page("<script>var a = '$&';</script>"))
    expect(html).toContain("<script>var a = '$&';</script>")
  })
})
