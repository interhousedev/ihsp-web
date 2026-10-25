import { describe, expect, it } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import catalog from "./catalog.json"

const backendDir = process.env.IHSP_BACKEND_DIR ?? resolve(import.meta.dir, "../../../../../iht-backend")
const backendCatalog = resolve(backendDir, "app/shared/openui/catalog.json")

describe("OPENUI-2 catalog copy", () => {
  it.skipIf(!existsSync(backendCatalog))("is identical to the backend catalog", () => {
    expect(readFileSync(resolve(import.meta.dir, "catalog.json"), "utf8")).toBe(readFileSync(backendCatalog, "utf8"))
  })

  it("names the fence and the root", () => {
    expect(catalog.fence).toBe("openui")
    expect(catalog.root).toBe("Stack")
  })
})
