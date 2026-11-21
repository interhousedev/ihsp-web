/** The installable apps' web manifests: complete enough for Android/iOS install and the long-press shortcuts. */
import { describe, expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const APPS_DIR = join(import.meta.dir, "../../../../..")

interface Manifest {
  display: string
  theme_color: string
  background_color: string
  start_url: string
  icons: { src: string; purpose: string }[]
  shortcuts?: { url: string; name: string; icons: { src: string }[] }[]
}

function load(app: string): Manifest {
  return JSON.parse(readFileSync(join(APPS_DIR, app, "public/manifest.webmanifest"), "utf8")) as Manifest
}

describe.each(["sp", "staff", "lms"])("%s manifest", (app) => {
  const manifest = load(app)

  test("is standalone with colours and icons that exist", () => {
    expect(manifest.display).toBe("standalone")
    expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true)
    expect(manifest.icons.some((icon) => icon.purpose === "any")).toBe(true)
    for (const icon of manifest.icons) expect(existsSync(join(APPS_DIR, app, "public", icon.src))).toBe(true)
    expect(existsSync(join(APPS_DIR, app, "public/icons/apple-touch-icon.png"))).toBe(true)
  })

  test("shortcuts point inside the app and use existing icons", () => {
    for (const shortcut of manifest.shortcuts ?? []) {
      expect(shortcut.url.startsWith("/")).toBe(true)
      for (const icon of shortcut.icons) expect(existsSync(join(APPS_DIR, app, "public", icon.src))).toBe(true)
    }
  })
})

test("the student app offers Timetable, Homework and AI chat shortcuts", () => {
  expect((load("sp").shortcuts ?? []).map((shortcut) => shortcut.url)).toEqual([
    "/timetable",
    "/homework",
    "/assistant",
  ])
})
