/** Staff as an installable app: `APP_MODE=pwa` adds the manifest and registers the service worker; a plain website does neither. */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { createPwaHeadScript } from "@ihsp/features-core/pwa/head"
import { TEST_ENV, apiUrl, server } from "@ihsp/test-utils"
import { PwaRuntime, useInstallAppMenuItem } from "@ihsp/features-core/pwa"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { renderStaff } from "./helpers"

const PUBLIC = join(import.meta.dir, "..", "..", "public")

function setMode(mode: "web" | "pwa"): void {
  window.__ENV__ = { ...TEST_ENV, APP_MODE: mode, OAUTH_CLIENT_ID: "staff" }
  resetConfig()
}

function InstallEntry() {
  const item = useInstallAppMenuItem()
  return item ? <button type="button">{item.title}</button> : null
}

const register = mock(async () => ({}) as ServiceWorkerRegistration)
/** `NODE_ENV` is read-only in the typings; the registration only happens in production. */
const env = process.env as Record<string, string | undefined>
const previousEnv = env.NODE_ENV

beforeEach(() => {
  register.mockClear()
  Object.defineProperty(window.navigator, "serviceWorker", {
    configurable: true,
    value: {
      register,
      getRegistration: async () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  })
  server.use(http.get(apiUrl("/v1/app/version"), () => HttpResponse.json({ latest: "1.0.0", min_supported: "1.0.0" })))
})

afterEach(() => {
  delete (window.navigator as unknown as Record<string, unknown>).serviceWorker
  env.NODE_ENV = previousEnv
  document.head.innerHTML = ""
})

describe("the files of the installable Staff", () => {
  test("the manifest names the app and uses its own id", () => {
    const manifest = JSON.parse(readFileSync(join(PUBLIC, "manifest.webmanifest"), "utf8")) as Record<string, unknown>

    expect(manifest.name).toBe("IHT Учителям")
    expect(manifest.short_name).toBe("IHT Учителям")
    expect(manifest.id).toBe("/?app=staff")
    expect(manifest.scope).toBe("/")
    expect(manifest.display).toBe("standalone")
    expect(manifest.theme_color).toBeString()
  })

  test("the icons, the offline page and the runtime config are in public/", () => {
    for (const file of [
      "icons/icon-192.png",
      "icons/icon-512.png",
      "icons/icon-maskable-512.png",
      "icons/badge-96.png",
    ]) {
      expect(existsSync(join(PUBLIC, file)), file).toBe(true)
    }
    expect(readFileSync(join(PUBLIC, "offline.html"), "utf8")).toContain("/offline.js")
    expect(readFileSync(join(PUBLIC, "env.js"), "utf8")).toContain('APP_MODE: "web"')
  })

  test("build:sw bundles the shared worker entry", () => {
    const pkg = JSON.parse(readFileSync(join(import.meta.dir, "..", "..", "package.json"), "utf8")) as {
      scripts: Record<string, string>
    }

    expect(pkg.scripts["build:sw"]).toContain("features-core/src/pwa/sw/generic.ts")
    expect(pkg.scripts.build).toContain("bun run build:sw && next build")
  })
})

describe("pwa mode", () => {
  test("the head script adds the manifest link and the app name for iOS", () => {
    setMode("pwa")
    new Function(createPwaHeadScript("IHT Учителям"))()

    expect(document.head.querySelector("link[rel=manifest]")?.getAttribute("href")).toBe("/manifest.webmanifest")
    expect(document.head.querySelector("meta[name=apple-mobile-web-app-title]")?.getAttribute("content")).toBe(
      "IHT Учителям",
    )
  })

  test("the runtime registers the service worker with the app id", async () => {
    setMode("pwa")
    env.NODE_ENV = "production"

    renderStaff(<PwaRuntime />)

    await waitFor(() => expect(register).toHaveBeenCalledTimes(1))
    const [url, options] = register.mock.calls[0] as unknown as [string, object]
    expect(url).toStartWith("/sw.js?api=")
    expect(url).toContain("&app=staff")
    expect(options).toEqual({ scope: "/", updateViaCache: "none" })
  })

  test("the profile menu offers to install the app", () => {
    setMode("pwa")

    renderStaff(<InstallEntry />)

    expect(screen.getByRole("button", { name: "Install the app" })).toBeInTheDocument()
  })
})

describe("a plain website", () => {
  test("adds no manifest, registers nothing and offers no install entry", async () => {
    setMode("web")
    env.NODE_ENV = "production"
    new Function(createPwaHeadScript("IHT Учителям"))()

    renderStaff(
      <>
        <PwaRuntime />
        <InstallEntry />
      </>,
    )
    await new Promise((resolve) => setTimeout(resolve, 30))

    expect(document.head.querySelector("link[rel=manifest]")).toBeNull()
    expect(register).not.toHaveBeenCalled()
    expect(screen.queryByRole("button", { name: "Install the app" })).not.toBeInTheDocument()
  })
})

describe("the settings card", () => {
  test("the settings card is offered in the installed app and absent on the website", async () => {
    const { AppLockSection } = await import("@ihsp/features-core/pwa/lock")
    setMode("web")
    const first = renderStaff(<AppLockSection />)
    expect(screen.queryByText("App lock")).not.toBeInTheDocument()
    first.unmount()

    setMode("pwa")
    renderStaff(<AppLockSection />)
    expect(await screen.findByText("App lock is off.")).toBeInTheDocument()
  })
})
