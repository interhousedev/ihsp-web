// Copies the in-browser runtimes of code blocks into public/, so they are served from the LMS origin:
// - Pyodide (CPython on WebAssembly) into public/pyodide/
// - sql.js (SQLite on WebAssembly) into public/sqljs/
// The sandboxed runner page public/code-runner/runner.{html,js} (committed) loads them into Web Workers. Its frame
// has an opaque origin, so the files need `Access-Control-Allow-Origin: *` (deploy/sites/lms.conf, next.config.ts in
// dev). Runs before `next build` and `next dev`; the output is git-ignored.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..")
const require = createRequire(join(appDir, "package.json"))

function copy(pkg, from, files, out) {
  const src = join(dirname(require.resolve(`${pkg}/package.json`)), from)
  const outDir = join(appDir, "public", out)
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  for (const file of files) {
    if (!existsSync(join(src, file))) throw new Error(`${pkg} has no ${from}/${file}: the package layout changed`)
    cpSync(join(src, file), join(outDir, file))
  }
  console.log(`${pkg} copied to ${outDir}`)
}

copy(
  "pyodide",
  ".",
  ["pyodide.js", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"],
  "pyodide",
)
copy("sql.js", "dist", ["sql-wasm.js", "sql-wasm.wasm"], "sqljs")
