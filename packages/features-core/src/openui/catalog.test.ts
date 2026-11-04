import { describe, expect, it } from "bun:test"
import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import catalog from "./catalog.json"

const backendDir = process.env.IHSP_BACKEND_DIR ?? resolve(import.meta.dir, "../../../../../iht-backend")
const backendOpenUi = resolve(backendDir, "app/shared/openui")

// CI checks out only this repository, so the backend copy is missing there. The check then compares the vendored file
// with a pinned SHA-256 instead of skipping. When the backend changes a file, copy it here and update the pin.
const PINNED = {
  "catalog.json": "888d1d15be4c203b202a7292f410d26792072a946cb0bb9f7867fcbf9148e95b",
  "corpus.json": "ab8d4ae355cbfaf4e018870ac4dd30e09762c82b755d8f720cd48726923f0c86",
} as const

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex")

describe("OPENUI-2 vendored backend files", () => {
  for (const name of Object.keys(PINNED) as (keyof typeof PINNED)[]) {
    it(`${name} matches the backend copy, or its pinned digest when the backend is not checked out`, () => {
      const local = readFileSync(resolve(import.meta.dir, name), "utf8")
      const backend = resolve(backendOpenUi, name)
      if (existsSync(backend)) {
        expect(local).toBe(readFileSync(backend, "utf8"))
      } else {
        expect(sha256(local)).toBe(PINNED[name])
      }
    })
  }

  it("names the fence and the root", () => {
    expect(catalog.fence).toBe("openui")
    expect(catalog.root).toBe("Stack")
  })
})
