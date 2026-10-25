// Copies the H5P player frame (h5p-standalone: main.bundle.js, frame.bundle.js, styles, fonts) and the sandboxed player page h5p-player/player.{html,js} into public/h5p-player/, so it is
// served from the LMS origin at /h5p-player/ (the URLs in features/player/utils/h5p.ts). The page CSP only allows
// scripts from 'self'. Runs before `next build` and `next dev`; the output is git-ignored.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..")
const require = createRequire(join(appDir, "package.json"))
const distDir = join(dirname(require.resolve("h5p-standalone/package.json")), "dist")
const outDir = join(appDir, "public", "h5p-player")

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })
for (const item of ["main.bundle.js", "frame.bundle.js", "styles", "fonts", "images"]) {
  const from = join(distDir, item)
  if (!existsSync(from)) throw new Error(`h5p-standalone has no dist/${item}: the package layout changed`)
  cpSync(from, join(outDir, item), { recursive: true })
}
for (const file of ["player.html", "player.js"]) cpSync(join(appDir, "h5p-player", file), join(outDir, file))
console.log(`H5P player assets copied to ${outDir}`)
