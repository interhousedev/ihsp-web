#!/usr/bin/env bun
/**
 * Per-page script policy for the static export: a CSP `<meta>` tag with sha256 hashes of the page's inline scripts.
 *
 * Static Next.js pages contain inline scripts, so `script-src` can't be a fixed nginx header (no
 * `'unsafe-inline'` allowed). After `next build` this script hashes every inline script of every
 * exported HTML file and inserts `<meta http-equiv="Content-Security-Policy" content="script-src ...">`
 * as the first child of `<head>`. The rest of the policy (connect-src, img-src, frame-ancestors, ...)
 * is the nginx header from `deploy/snippets/security-headers.conf`; the browser applies both and a
 * script must pass both. The meta policy therefore carries `script-src` only: `frame-ancestors` is
 * ignored in a meta tag, and any other directive here would be intersected with the header. The one
 * exception is `APP_DIRECTIVES` (the library's `worker-src`, see there).
 */
/* eslint-disable no-console -- command line script */
import * as crypto from "node:crypto"
import * as fs from "node:fs"
import * as path from "node:path"

export const APPS = ["id", "sp", "staff", "admin", "lms", "share", "library", "landing"] as const

/**
 * Directives some apps add to their page policy, after `script-src`.
 *
 * The library starts the self-hosted PDF.js worker, possibly from a `blob:` URL. A worker request falls
 * back to `script-src` when a policy has no `worker-src`, and `'self'` does not match `blob:`: so the
 * page policy has to name it too, next to the `worker-src` of the nginx header (security-headers-library.conf).
 */
export const APP_DIRECTIVES: Partial<Record<(typeof APPS)[number], string>> = {
  library: "worker-src 'self' blob:",
}

/** `sha256-<base64>` of the exact script text, as the browser computes it. */
export function hashScript(content: string): string {
  return `sha256-${crypto.createHash("sha256").update(content, "utf8").digest("base64")}`
}

/** CSP hash sources (`'sha256-...'`) of every inline `<script>` (no `src`) in the HTML, without duplicates. */
export function inlineScriptHashes(html: string): string[] {
  const hashes = new Set<string>()
  // Attributes may hold a quoted `>`. The browser ends the script at `</script` followed by whitespace, `/` or `>`,
  // and ignores anything inside the end tag (`</script >`, `</script foo>`, any case).
  const scriptRegex = /<script\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/script(?=[\s/>])[^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = scriptRegex.exec(html)) !== null) {
    const [, attributes = "", content = ""] = match
    if (/\ssrc\s*=/i.test(attributes) || content.length === 0) continue
    // The browser hashes the text as it is, whitespace included: no trimming.
    hashes.add(`'${hashScript(content)}'`)
  }
  return [...hashes]
}

/**
 * The one external script a page may load: the Telegram SDK (packages/telegram/src/sdk-loader.ts), as a
 * path source rather than the whole origin. A CSP path matches the request path exactly, query string
 * ignored, so the `?64` version suffix of the loader is fine.
 */
export const TELEGRAM_SDK_SOURCE = "https://telegram.org/js/telegram-web-app.js"

/**
 * The policy inserted into each page: scripts from the same origin, Telegram's SDK and the hashed inline
 * scripts, plus the app's own directives (`APP_DIRECTIVES`) when it has any.
 */
export function buildCspMeta(hashes: string[], extraDirectives = ""): string {
  const sources = ["'self'", ...hashes, TELEGRAM_SDK_SOURCE].join(" ")
  const policy = [`script-src ${sources}`, extraDirectives].filter((part) => part !== "").join("; ")
  return `<meta http-equiv="Content-Security-Policy" content="${policy}">`
}

/** Inserts the policy after the opening `<head>`; returns the HTML unchanged when there is nothing to hash. */
export function injectCsp(html: string, extraDirectives = ""): { html: string; hashCount: number } {
  if (html.includes('http-equiv="Content-Security-Policy"')) return { html, hashCount: 0 }
  const hashes = inlineScriptHashes(html)
  if (hashes.length === 0) return { html, hashCount: 0 }
  const meta = buildCspMeta(hashes, extraDirectives)
  const withMeta = html.replace(/<head(\s[^>]*)?>/i, (open) => `${open}${meta}`)
  return { html: withMeta, hashCount: withMeta === html ? 0 : hashes.length }
}

function findHtmlFiles(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (fs.statSync(full).isDirectory()) {
      findHtmlFiles(full, files)
    } else if (entry.endsWith(".html")) {
      files.push(full)
    }
  }
  return files
}

function processApp(root: string, appName: (typeof APPS)[number]): void {
  // Every app exports to apps/<app>/out; the share app's basePath (/ai) is applied when copying into the image.
  const outDir = path.join(root, "apps", appName, "out")
  if (!fs.existsSync(outDir)) {
    console.log(`Skipping ${appName}: output directory not found`)
    return
  }
  for (const htmlFile of findHtmlFiles(outDir)) {
    const { html, hashCount } = injectCsp(fs.readFileSync(htmlFile, "utf-8"), APP_DIRECTIVES[appName])
    if (hashCount > 0) {
      fs.writeFileSync(htmlFile, html)
      console.log(`Updated ${path.relative(root, htmlFile)} with ${hashCount} script hashes`)
    }
  }
}

if (import.meta.main) {
  console.log("Computing CSP hashes for all apps...")
  for (const app of APPS) processApp(process.cwd(), app)
  console.log("Done!")
}
