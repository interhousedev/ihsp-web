/**
 * Writes the brand values into the static files of the installable apps: name, short name, description and colours in
 * `public/manifest.webmanifest`, and the title of `public/offline.html`. Each app's `build` runs it; a test fails when
 * the committed files differ.
 *
 *   bun run packages/config/scripts/generate-brand-assets.ts
 */
import { readFileSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { BRAND, BRAND_PWA_APPS } from "../src/brand"

const APPS_DIR = resolve(import.meta.dir, "../../../apps")

function setManifestField(text: string, field: string, value: string): string {
  return text.replace(new RegExp(`^  "${field}": ".*"`, "m"), `  "${field}": ${JSON.stringify(value)}`)
}

/** Only top-level lines change, so the shortcuts and the formatting of the file stay. */
export function brandManifest(text: string, app: (typeof BRAND_PWA_APPS)[number]): string {
  const brand = BRAND.apps[app]
  let next = setManifestField(text, "name", brand.pwaName)
  next = setManifestField(next, "short_name", brand.pwaName)
  next = setManifestField(next, "description", brand.manifestDescription)
  next = setManifestField(next, "background_color", brand.manifestColor)
  return setManifestField(next, "theme_color", brand.manifestColor)
}

export function brandOfflinePage(text: string, app: (typeof BRAND_PWA_APPS)[number]): string {
  return text.replace(/<title>.*<\/title>/, `<title>${BRAND.apps[app].name}</title>`)
}

export function assetPaths(app: string): { manifest: string; offline: string } {
  return {
    manifest: join(APPS_DIR, app, "public/manifest.webmanifest"),
    offline: join(APPS_DIR, app, "public/offline.html"),
  }
}

if (import.meta.main) {
  for (const app of BRAND_PWA_APPS) {
    const { manifest, offline } = assetPaths(app)
    writeFileSync(manifest, brandManifest(readFileSync(manifest, "utf8"), app))
    writeFileSync(offline, brandOfflinePage(readFileSync(offline, "utf8"), app))
  }
}
