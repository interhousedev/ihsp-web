import { expect, test, type Frame, type Page } from "@playwright/test"
import fs from "node:fs"
import http from "node:http"
import type { AddressInfo } from "node:net"
import path from "node:path"

// The code runner sandbox (apps/lms/public/code-runner/) under the headers of deploy/sites/lms.conf, served by a
// static server inside the spec. Needs no backend: E2E_SKIP_PREFLIGHT=1 E2E_APPS=lms bunx playwright test
// e2e/code-runner-security.spec.ts --project=desktop
const publicDir = path.resolve(__dirname, "../apps/lms/public")
const lmsConf = fs.readFileSync(path.resolve(__dirname, "../deploy/sites/lms.conf"), "utf8")
const RUNNER_CSP = /location \/code-runner\/ \{[\s\S]*?Content-Security-Policy "([^"]+)"/.exec(lmsConf)?.[1] ?? ""
const TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".wasm": "application/wasm",
  ".json": "application/json",
  ".zip": "application/zip",
}

// The parent page: frames the runner like the LMS does and records every message it receives.
const HOST = `<!doctype html><meta charset="utf-8"><script>
document.cookie = "session=parent-secret; path=/"; localStorage.setItem("token", "parent-secret");
window.msgs = []; addEventListener("message", (e) => msgs.push({ origin: e.origin, fromRunner: e.source === frames[0], data: e.data }));
</script><iframe id="runner" sandbox="allow-scripts" src="/code-runner/runner.html"></iframe>`

let server: http.Server
let origin = ""
let other: http.Server
let otherOrigin = ""
const otherHits: string[] = []
// Requests to the same-origin API path: learner code must not reach /v1 either.
const sameOriginApiHits: string[] = []

test.beforeAll(async () => {
  expect(RUNNER_CSP).toContain("sandbox allow-scripts")
  server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x")
    if (url.pathname === "/host.html") return res.writeHead(200, { "content-type": "text/html" }).end(HOST)
    if (url.pathname.startsWith("/v1/")) {
      sameOriginApiHits.push(url.pathname)
      return res.writeHead(200, { "access-control-allow-origin": "*" }).end("{}")
    }
    const file = path.join(publicDir, path.normalize(url.pathname))
    let body: Buffer
    try {
      if (!file.startsWith(publicDir)) return res.writeHead(404).end()
      body = fs.readFileSync(file)
    } catch {
      return res.writeHead(404).end()
    }
    const headers: Record<string, string> = {
      "content-type": TYPES[path.extname(file)] ?? "application/octet-stream",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    }
    if (url.pathname.startsWith("/code-runner/")) headers["content-security-policy"] = RUNNER_CSP
    if (/^\/(pyodide|sqljs)\//.test(url.pathname)) {
      headers["access-control-allow-origin"] = "*"
      headers["cross-origin-resource-policy"] = "cross-origin"
    }
    res.writeHead(200, headers).end(body)
  })
  other = http.createServer((req, res) => {
    otherHits.push(req.url ?? "")
    res.writeHead(200, { "access-control-allow-origin": "*" }).end("leak")
  })
  await Promise.all([
    new Promise<void>((r) => server.listen(0, "127.0.0.1", r)),
    new Promise<void>((r) => other.listen(0, "127.0.0.1", r)),
  ])
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  otherOrigin = `http://127.0.0.1:${(other.address() as AddressInfo).port}`
})

test.afterAll(() => {
  server.close()
  other.close()
})

type Result = { error: string | null; timedOut: boolean; truncated: boolean; tests: { id: string; passed: boolean }[] }

async function open(page: Page): Promise<Frame> {
  await page.goto(`${origin}/host.html`)
  await page.waitForFunction(() =>
    (window as unknown as { msgs: { data: { kind: string } }[] }).msgs.some((m) => m.data?.kind === "hello"),
  )
  const frame = page.frames().find((f) => f.url().includes("/code-runner/"))
  if (!frame) throw new Error("no runner frame")
  return frame
}

async function run(page: Page, language: string, code: string, tests: object[] = [], timeLimitMs = 5000) {
  const id = `r${Math.random().toString(36).slice(2)}`
  await page.evaluate(
    (req) => (document.getElementById("runner") as HTMLIFrameElement).contentWindow?.postMessage(req, "*"),
    { type: "ihsp-code", kind: "run", id, language, code, tests, timeLimitMs },
  )
  const handle = await page.waitForFunction(
    (runId) => {
      const msgs = (window as unknown as { msgs: { data: Record<string, unknown> }[] }).msgs
      const done = msgs.find((m) => m.data?.id === runId && m.data.kind === "result")
      if (!done) return null
      const output = msgs
        .filter((m) => m.data?.id === runId && m.data.kind === "output")
        .map((m) => m.data.text)
        .join("")
      return { result: done.data, output }
    },
    id,
    { timeout: 120_000, polling: 100 },
  )
  return (await handle.jsonValue()) as { result: Result; output: string }
}

test.describe("code runner sandbox", () => {
  test.setTimeout(240_000)

  test("CSP 'self' works in the opaque frame: Python, SQL and JS run and grade", async ({ page }) => {
    await open(page)
    const py = await run(
      page,
      "python",
      "def add(a, b):\n    return a + b\nprint(add(2, 3))",
      [
        { id: "ok", name: "ok", code: "assert add(2, 3) == 5" },
        { id: "bad", name: "bad", code: "assert add(2, 2) == 5" },
      ],
      30_000,
    )
    expect(py.result.error).toBeNull()
    expect(py.output).toContain("5")
    expect(py.result.tests).toEqual([
      expect.objectContaining({ id: "ok", passed: true }),
      expect.objectContaining({ id: "bad", passed: false }),
    ])
    const sql = await run(page, "sql", "CREATE TABLE t(x); INSERT INTO t VALUES (1),(2); SELECT sum(x) FROM t;", [
      { id: "s", name: "s", code: "SELECT 3" },
    ])
    expect(sql.result.tests).toEqual([expect.objectContaining({ id: "s", passed: true })])
    const js = await run(page, "javascript", "const add = (a, b) => a + b; console.log(add(1, 1))", [
      { id: "j", name: "j", code: "assert(add(2, 3) === 5)" },
    ])
    expect(js.output).toContain("2")
    expect(js.result.tests).toEqual([expect.objectContaining({ id: "j", passed: true })])
  })

  test("an infinite loop is stopped by the time limit and the runner stays usable", async ({ page }) => {
    await open(page)
    const loop = await run(page, "javascript", "while (true) {}", [], 1000)
    expect(loop.result.timedOut).toBe(true)
    const pyLoop = await run(page, "python", "while True:\n    pass", [], 2000)
    expect(pyLoop.result.timedOut).toBe(true)
    expect((await run(page, "javascript", "console.log('alive')")).output).toContain("alive")
  })

  test("no network from learner code: fetch, XHR, WebSocket, importScripts", async ({ page }) => {
    await open(page)
    const js = await run(
      page,
      "javascript",
      [
        "for (const name of ['fetch','XMLHttpRequest','WebSocket','EventSource','importScripts','Worker','indexedDB','caches','BroadcastChannel'])",
        "  console.log(name + '=' + typeof self[name])",
        `try { importScripts('${otherOrigin}/x.js') } catch (e) { console.log('importScripts:' + e.name) }`,
        `try { new WebSocket('ws://127.0.0.1:1') } catch (e) { console.log('ws:' + e.name) }`,
        `try { await fetch('${otherOrigin}/f') } catch (e) { console.log('fetch:' + e.name) }`,
      ].join("\n"),
    )
    for (const name of ["fetch", "XMLHttpRequest", "WebSocket", "importScripts", "Worker", "indexedDB"]) {
      expect(js.output).toContain(`${name}=undefined`)
    }
    const py = await run(
      page,
      "python",
      [
        "import js",
        "for name in ('fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'Worker', 'indexedDB', 'caches', 'BroadcastChannel'):",
        "    print(name, getattr(js, name, None))",
        "for target in ('/v1/me', '" + otherOrigin + "/p'):",
        "    try:",
        "        js.fetch(target)",
        "        print('js-fetch-open', target)",
        "    except Exception as e:",
        "        print('js-fetch-blocked', type(e).__name__)",
        "for module in ('pyodide.http', 'pyodide_js'):",
        "    try:",
        "        __import__(module)",
        "        print('import-open', module)",
        "    except ImportError:",
        "        print('import-blocked', module)",
        "import pyodide",
        "print('pyodide.http', hasattr(pyodide, 'http'))",
        "try:",
        "    js.self.postMessage({'type': 'ihsp-code'})",
        "    print('post-open')",
        "except Exception as e:",
        "    print('post-blocked', type(e).__name__)",
      ].join("\n"),
      [],
      30_000,
    )
    expect(py.result.error).toBeNull()
    for (const name of [
      "fetch",
      "XMLHttpRequest",
      "WebSocket",
      "EventSource",
      "importScripts",
      "Worker",
      "indexedDB",
    ]) {
      expect(py.output).toContain(`${name} None`)
    }
    expect(py.output).not.toContain("js-fetch-open")
    expect(py.output).toContain("import-blocked pyodide.http")
    expect(py.output).toContain("import-blocked pyodide_js")
    expect(py.output).toContain("pyodide.http False")
    expect(py.output).toContain("post-blocked")
    expect(sameOriginApiHits).toEqual([])
    expect(otherHits).toEqual([])
  })

  test("the frame cannot read parent cookies or storage, nor reach other origins", async ({ page }) => {
    const frame = await open(page)
    const probe = await frame.evaluate(async (target) => {
      const attempt = async (fn: () => unknown) => {
        try {
          return `ok:${String(await fn())}`
        } catch (error) {
          return `blocked:${(error as Error).name}`
        }
      }
      return {
        origin: self.origin,
        cookie: await attempt(() => document.cookie),
        storage: await attempt(() => localStorage.getItem("token")),
        parentDom: await attempt(() => window.parent.document.cookie),
        connect: await attempt(() => fetch(`${target}/frame`).then((r) => r.text())),
      }
    }, otherOrigin)
    expect(probe.origin).toBe("null")
    expect(probe.cookie).toMatch(/^blocked:|^ok:$/)
    expect(probe.storage).toMatch(/^blocked:/)
    expect(probe.parentDom).toMatch(/^blocked:/)
    expect(probe.connect).toMatch(/^blocked:/)
    expect(otherHits).toEqual([])
    const worker = await run(page, "javascript", "console.log(typeof document, typeof localStorage, typeof parent)")
    expect(worker.output).toContain("undefined undefined undefined")
  })

  test("the frame cannot navigate the top window", async ({ page }) => {
    const frame = await open(page)
    const result = await frame.evaluate((target) => {
      try {
        window.top!.location.href = target
        return "navigated"
      } catch (error) {
        return `blocked:${(error as Error).name}`
      }
    }, `${otherOrigin}/top`)
    await page.waitForTimeout(500)
    expect(page.url()).toBe(`${origin}/host.html`)
    expect(result).not.toBe("navigated")
  })

  test("huge output is capped at 64 KB", async ({ page }) => {
    await open(page)
    const big = await run(page, "javascript", "for (let i = 0; i < 1e6; i++) console.log('x'.repeat(100))", [], 10_000)
    expect(big.result.truncated).toBe(true)
    expect(big.output.length).toBeLessThanOrEqual(64 * 1024 + 1024)
    const pyBig = await run(page, "python", "print('y' * 10_000_000)", [], 30_000)
    expect(pyBig.result.truncated).toBe(true)
    expect(pyBig.output.length).toBeLessThanOrEqual(64 * 1024 + 1024)
  })

  test("a run posted by another frame is ignored", async ({ page }) => {
    await open(page)
    await page.evaluate(() => {
      const evil = document.createElement("iframe")
      evil.setAttribute("sandbox", "allow-scripts")
      evil.srcdoc = `<script>parent.frames[0].postMessage({type:"ihsp-code",kind:"run",id:"forged",language:"javascript",code:"console.log(1)",tests:[],timeLimitMs:1000},"*")</script>`
      document.body.append(evil)
    })
    await page.waitForTimeout(1500)
    const forged = await page.evaluate(() =>
      (window as unknown as { msgs: { data: { id?: string } }[] }).msgs.filter((m) => m.data?.id === "forged"),
    )
    expect(forged).toEqual([])
    // The runner still answers its real parent.
    expect((await run(page, "javascript", "console.log('parent')")).output).toContain("parent")
  })
})
