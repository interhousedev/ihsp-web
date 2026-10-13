// Copies the pdf.js assets the reader loads at runtime (CMaps, standard fonts, WASM, ICC profiles) from
// pdfjs-dist into public/pdfjs/, so they are served at /pdfjs/ (the URLs in features-core pdf-engine.ts).
// Runs before `next build`; the output is git-ignored. The student and staff apps run it with their own
// directory as the argument (their notebook PDF preview uses the same engine).
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const appDir = process.argv[2] ? resolve(process.argv[2]) : join(dirname(fileURLToPath(import.meta.url)), "..")
// pdfjs-dist is declared by features-core, so resolve it from there.
const featuresCore = createRequire(
  join(dirname(fileURLToPath(import.meta.url)), "../../../packages/features-core/package.json"),
)
const pdfjsDir = dirname(featuresCore.resolve("pdfjs-dist/package.json"))
const outDir = join(appDir, "public", "pdfjs")

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })
for (const dir of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
  const from = join(pdfjsDir, dir)
  if (!existsSync(from)) throw new Error(`pdfjs-dist has no ${dir}/ folder: the pdf.js layout changed`)
  cpSync(from, join(outDir, dir), { recursive: true })
}
console.log(`pdf.js assets copied to ${outDir}`)
