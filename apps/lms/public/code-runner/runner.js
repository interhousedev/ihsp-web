// The code runner of code blocks (Python via Pyodide, JavaScript, SQL via sql.js). Learner code never runs on the
// server and never in the LMS page: this page is framed with sandbox="allow-scripts" (opaque origin) and runs each
// program in a dedicated Web Worker built from a blob: URL.
//
// Protocol (window.postMessage, every message has `type: "ihsp-code"`):
//   frame -> parent  {kind: "hello"}                                    the frame is listening
//   parent -> frame  {kind: "run", id, language, code, tests, timeLimitMs}
//   frame -> parent  {kind: "status", id, status: "loading" | "running"}
//   frame -> parent  {kind: "output", id, stream: "stdout" | "stderr", text}
//   frame -> parent  {kind: "result", id, error, timedOut, truncated, tests: [{id, passed, message}]}
// The frame only accepts messages of its parent window from the LMS origin (the origin this page is served from)
// and only posts to that origin. The parent checks source (this frame) and origin ("null", the opaque origin).
//
// Limits: the time limit is enforced by terminating the worker (a fresh one is made for the next run); output is
// capped at 64 KB per run; a crashing worker (memory exhaustion) ends the run with an error. Before learner code
// runs, the worker removes fetch, XMLHttpRequest, WebSocket, EventSource, importScripts, nested workers and its
// own postMessage; the page policy (runner.html) allows no other origin anyway.
"use strict"
;(() => {
  const TYPE = "ihsp-code"
  const LMS_ORIGIN = new URL(location.href).origin
  const OUTPUT_CAP = 64 * 1024
  const LANGUAGES = ["python", "javascript", "sql"]
  const MAX_CODE = 20_000
  const MAX_TEST_CODE = 5_000
  const MAX_TESTS = 30

  const send = (message) => window.parent.postMessage({ type: TYPE, ...message }, LMS_ORIGIN)

  const str = (value, max) => typeof value === "string" && value.length <= max

  /** The run request, rebuilt field by field, or null. */
  function parseRun(data) {
    if (!data || typeof data !== "object" || data.type !== TYPE || data.kind !== "run") return null
    const { id, language, code, tests, timeLimitMs } = data
    if (!str(id, 64) || id === "" || !LANGUAGES.includes(language) || !str(code, MAX_CODE)) return null
    if (!Number.isInteger(timeLimitMs) || timeLimitMs < 1000 || timeLimitMs > 30_000) return null
    if (!Array.isArray(tests) || tests.length > MAX_TESTS) return null
    const clean = []
    for (const test of tests) {
      if (!test || typeof test !== "object") return null
      if (!str(test.id, 64) || !str(test.name, 200) || !str(test.code, MAX_TEST_CODE)) return null
      clean.push({ id: test.id, name: test.name, code: test.code })
    }
    return { id, language, code, tests: clean, timeLimitMs }
  }

  // - - - Worker sources (stringified into blob: workers; they share nothing with this page) - - -

  /** Removes every way out of the worker; returns the captured postMessage. */
  function lockdown(scope) {
    const post = scope.postMessage.bind(scope)
    const names = [
      "fetch",
      "XMLHttpRequest",
      "WebSocket",
      "WebSocketStream",
      "EventSource",
      "WebTransport",
      "importScripts",
      "Worker",
      "SharedWorker",
      "BroadcastChannel",
      "indexedDB",
      "caches",
      "postMessage",
    ]
    for (const name of names) {
      for (let target = scope; target; target = Object.getPrototypeOf(target)) {
        try {
          if (Object.prototype.hasOwnProperty.call(target, name)) delete target[name]
        } catch {}
      }
      try {
        Object.defineProperty(scope, name, { value: undefined, writable: false, configurable: false })
      } catch {}
    }
    return post
  }

  /** Output with a per-run cap; `post` is the captured postMessage. */
  function makeOutput(post, cap) {
    let used = 0
    let truncated = false
    return {
      reset() {
        used = 0
        truncated = false
      },
      write(stream, text) {
        if (truncated || !text) return
        const room = cap - used
        if (text.length > room) {
          text = text.slice(0, room)
          truncated = true
        }
        used += text.length
        if (text) post({ kind: "output", stream, text })
        if (truncated) post({ kind: "truncated" })
      },
      get truncated() {
        return truncated
      },
    }
  }

  function pythonWorker(cfg, lockdown, makeOutput) {
    const RUNNER = `
import json, sys, traceback

def _ihsp_format(error):
    tb = error.__traceback__
    while tb is not None and tb.tb_frame.f_code.co_filename != "main.py" and tb.tb_frame.f_code.co_filename != "test.py":
        tb = tb.tb_next
    return "".join(traceback.format_exception(type(error), error, tb))

def _ihsp_run(code, tests_json):
    ns = {"__name__": "__main__"}
    error = None
    try:
        exec(compile(code, "main.py", "exec"), ns)
    except SystemExit:
        pass
    except BaseException as exc:
        error = _ihsp_format(exc)
    sys.stdout.flush()
    results = []
    for test in json.loads(tests_json):
        if error is not None:
            results.append({"id": test["id"], "passed": False, "message": ""})
            continue
        try:
            exec(compile(test["code"], "test.py", "exec"), dict(ns))
            results.append({"id": test["id"], "passed": True, "message": ""})
        except AssertionError as exc:
            results.append({"id": test["id"], "passed": False, "message": str(exc)[:500]})
        except BaseException as exc:
            results.append({"id": test["id"], "passed": False, "message": _ihsp_format(exc)[-500:]})
    return json.dumps({"error": error, "tests": results})

# No way out from Python: the worker globals are already undefined (lockdown), and the Pyodide helpers that wrap
# them, or reach the loader's module object, cannot be imported.
import pyodide
for _name in ("pyodide.http", "pyodide_js", "pyodide.webloop"):
    sys.modules[_name] = None
for _name in ("http", "webloop"):
    if hasattr(pyodide, _name):
        delattr(pyodide, _name)
del pyodide, _name
`
    let run = null
    let post = null
    let output = null
    const start = async () => {
      try {
        importScripts(cfg.base + "pyodide.js")
        const pyodide = await self.loadPyodide({ indexURL: cfg.base, packages: [] })
        const decoder = { stdout: new TextDecoder(), stderr: new TextDecoder() }
        const writer = (stream) => ({
          write: (buffer) => {
            output.write(stream, decoder[stream].decode(buffer, { stream: true }))
            return buffer.length
          },
        })
        pyodide.setStdout(writer("stdout"))
        pyodide.setStderr(writer("stderr"))
        pyodide.setStdin({ error: true })
        pyodide.runPython(RUNNER)
        run = pyodide.globals.get("_ihsp_run")
        post = lockdown(self)
        output = makeOutput(post, cfg.cap)
        post({ kind: "ready" })
      } catch (error) {
        self.postMessage({ kind: "fatal", message: String(error && error.message ? error.message : error) })
      }
    }
    self.onmessage = (event) => {
      const message = event.data
      if (!run || !message || message.kind !== "run") return
      output.reset()
      try {
        const result = JSON.parse(run(message.code, JSON.stringify(message.tests)))
        post({ kind: "done", error: result.error, tests: result.tests, truncated: output.truncated })
      } catch (error) {
        post({ kind: "done", error: String(error), tests: [], truncated: output.truncated })
      }
    }
    start()
  }

  function sqlWorker(cfg, lockdown, makeOutput) {
    let SQL = null
    let post = null
    let output = null
    const table = (result) => {
      if (!result) return ""
      const rows = [
        result.columns,
        ...result.values.map((row) => row.map((cell) => (cell === null ? "NULL" : String(cell)))),
      ]
      const widths = result.columns.map((_, i) => Math.min(40, Math.max(...rows.map((row) => String(row[i]).length))))
      const line = (row) => row.map((cell, i) => String(cell).slice(0, 40).padEnd(widths[i])).join(" | ")
      return [line(rows[0]), widths.map((w) => "-".repeat(w)).join("-+-"), ...rows.slice(1).map(line)].join("\n") + "\n"
    }
    const last = (results) => (results.length ? results[results.length - 1] : null)
    const same = (a, b) => JSON.stringify(a ? a.values : []) === JSON.stringify(b ? b.values : [])
    const start = async () => {
      try {
        importScripts(cfg.base + "sql-wasm.js")
        SQL = await self.initSqlJs({ locateFile: (file) => cfg.base + file })
        post = lockdown(self)
        output = makeOutput(post, cfg.cap)
        post({ kind: "ready" })
      } catch (error) {
        self.postMessage({ kind: "fatal", message: String(error && error.message ? error.message : error) })
      }
    }
    self.onmessage = (event) => {
      const message = event.data
      if (!SQL || !message || message.kind !== "run") return
      output.reset()
      const db = new SQL.Database()
      let error = null
      let mine = null
      try {
        const results = db.exec(message.code)
        mine = last(results)
        for (const result of results) output.write("stdout", table(result) + "\n")
      } catch (exc) {
        error = String(exc && exc.message ? exc.message : exc)
      }
      const tests = message.tests.map((test) => {
        if (error !== null) return { id: test.id, passed: false, message: "" }
        try {
          const expected = last(db.exec(test.code))
          return same(mine, expected)
            ? { id: test.id, passed: true, message: "" }
            : { id: test.id, passed: false, message: "Expected:\n" + table(expected) }
        } catch (exc) {
          return { id: test.id, passed: false, message: String(exc && exc.message ? exc.message : exc) }
        }
      })
      db.close()
      post({ kind: "done", error, tests, truncated: output.truncated })
    }
    start()
  }

  /** The prelude of a JavaScript run: console, assert and the test harness; then the learner code follows. */
  function jsPrelude(cfg, lockdown, makeOutput) {
    const post = lockdown(self)
    const output = makeOutput(post, cfg.cap)
    const show = (value) => {
      if (typeof value === "string") return value
      try {
        return JSON.stringify(value) ?? String(value)
      } catch {
        return String(value)
      }
    }
    const print =
      (stream) =>
      (...args) =>
        output.write(stream, args.map(show).join(" ") + "\n")
    const console = {
      log: print("stdout"),
      info: print("stdout"),
      debug: print("stdout"),
      warn: print("stderr"),
      error: print("stderr"),
    }
    Object.defineProperty(self, "console", { value: console, writable: false, configurable: false })
    const results = []
    let error = null
    const describe = (exc) => (exc && exc.stack ? String(exc.stack).split("\n").slice(0, 4).join("\n") : String(exc))
    return {
      assert(condition, message) {
        if (!condition) throw Object.assign(new Error(message || "Assertion failed"), { name: "AssertionError" })
      },
      fail(exc) {
        error = describe(exc)
      },
      async test(id, body) {
        if (error !== null) return results.push({ id, passed: false, message: "" })
        try {
          await body()
          results.push({ id, passed: true, message: "" })
        } catch (exc) {
          results.push({
            id,
            passed: false,
            message: exc && exc.name === "AssertionError" ? exc.message : describe(exc),
          })
        }
      },
      done() {
        post({ kind: "done", error, tests: results, truncated: output.truncated })
      },
    }
  }

  // - - - Workers - - -

  const assetBase = (dir) => new URL(`/${dir}/`, LMS_ORIGIN).href
  const shared = `${lockdown}\n${makeOutput}\n`

  function blobWorker(source) {
    const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }))
    const worker = new Worker(url)
    URL.revokeObjectURL(url)
    return worker
  }

  function runtimeWorker(language) {
    const body = language === "python" ? pythonWorker : sqlWorker
    const cfg = { base: assetBase(language === "python" ? "pyodide" : "sqljs"), cap: OUTPUT_CAP }
    return blobWorker(`${shared}(${body})(${JSON.stringify(cfg)}, lockdown, makeOutput)`)
  }

  function jsWorker(code, tests) {
    const cfg = { cap: OUTPUT_CAP }
    const testCalls = tests
      .map((test) => `await __ihsp.test(${JSON.stringify(test.id)}, async () => {\n${test.code}\n});`)
      .join("\n")
    return blobWorker(
      `${shared}const __ihsp = (${jsPrelude})(${JSON.stringify(cfg)}, lockdown, makeOutput);\n` +
        `const assert = __ihsp.assert;\n` +
        `(async () => {\ntry {\n${code}\n;\n${testCalls}\n} catch (__e) { __ihsp.fail(__e) }\n__ihsp.done()\n})();\n`,
    )
  }

  // One runtime worker (Python or SQL) is kept between runs; JavaScript gets a fresh worker per run.
  let runtime = null // {language, worker, ready: Promise}
  let current = null // {id, worker, timer, tests, ownWorker}

  function dropRuntime() {
    if (runtime) runtime.worker.terminate()
    runtime = null
  }

  function ensureRuntime(language) {
    if (runtime && runtime.language === language) return runtime
    dropRuntime()
    const worker = runtimeWorker(language)
    const entry = { language, worker, ready: null }
    entry.ready = new Promise((resolve, reject) => {
      worker.onmessage = (event) => {
        const message = event.data
        if (message && message.kind === "ready") resolve()
        else if (message && message.kind === "fatal") reject(new Error(String(message.message)))
      }
      worker.onerror = (event) => {
        event.preventDefault()
        reject(new Error(event.message || "The runtime could not start"))
      }
    })
    runtime = entry
    return entry
  }

  function finish(result) {
    if (!current) return
    const run = current
    clearTimeout(run.timer)
    current = null
    if (run.ownWorker) run.worker.terminate()
    const byId = new Map((result.tests || []).map((test) => [test.id, test]))
    send({
      kind: "result",
      id: run.id,
      error: typeof result.error === "string" ? result.error.slice(0, 4000) : null,
      timedOut: Boolean(result.timedOut),
      truncated: Boolean(result.truncated),
      tests: run.tests.map((test) => {
        const found = byId.get(test.id)
        return {
          id: test.id,
          passed: Boolean(found && found.passed === true),
          message: found && typeof found.message === "string" ? found.message.slice(0, 1000) : "",
        }
      }),
    })
  }

  function attach(worker, id) {
    let truncated = false
    worker.onmessage = (event) => {
      const message = event.data
      if (!current || current.id !== id || !message || typeof message !== "object") return
      if (message.kind === "output" && (message.stream === "stdout" || message.stream === "stderr")) {
        if (typeof message.text === "string") send({ kind: "output", id, stream: message.stream, text: message.text })
      } else if (message.kind === "truncated") {
        truncated = true
      } else if (message.kind === "done") {
        finish({ error: message.error, tests: message.tests, truncated: truncated || message.truncated })
      }
    }
    worker.onerror = (event) => {
      event.preventDefault()
      if (current && current.id === id) {
        if (!current.ownWorker) dropRuntime()
        finish({ error: event.message || "The program crashed", tests: [], truncated })
      }
    }
  }

  async function start(request) {
    if (current) {
      // A new run replaces a running one: stop it.
      if (current.ownWorker) current.worker.terminate()
      else dropRuntime()
      clearTimeout(current.timer)
      current = null
    }
    const run = { id: request.id, tests: request.tests, timer: 0, worker: null, ownWorker: false }
    current = run
    if (request.language === "javascript") {
      run.ownWorker = true
      run.worker = jsWorker(request.code, request.tests)
    } else {
      send({ kind: "status", id: run.id, status: "loading" })
      const entry = ensureRuntime(request.language)
      try {
        await entry.ready
      } catch (error) {
        if (runtime === entry) dropRuntime()
        if (current === run) finish({ error: String(error.message || error), tests: [] })
        return
      }
      if (current !== run) return
      run.worker = entry.worker
      run.worker.postMessage({ kind: "run", code: request.code, tests: request.tests })
    }
    attach(run.worker, run.id)
    send({ kind: "status", id: run.id, status: "running" })
    run.timer = setTimeout(() => {
      if (current !== run) return
      if (run.ownWorker) run.worker.terminate()
      else dropRuntime()
      finish({ error: null, tests: [], timedOut: true })
    }, request.timeLimitMs)
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || event.origin !== LMS_ORIGIN) return
    const request = parseRun(event.data)
    if (request) void start(request)
  })
  send({ kind: "hello" })
})()
