import { afterEach, describe, expect, it, setDefaultTimeout } from "bun:test"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"

const deployDir = import.meta.dir
const sitesDir = path.join(deployDir, "sites")
const snippetsDir = path.join(deployDir, "snippets")

const read = (...parts: string[]) => fs.readFileSync(path.join(deployDir, ...parts), "utf-8")
const confFiles = (dir: string) => fs.readdirSync(dir).filter((f) => f.endsWith(".conf"))

/** The Content-Security-Policy header line of a security-headers snippet (comments excluded). */
const cspHeader = (snippet: string) =>
  snippet
    .split("\n")
    .filter((line) => line.startsWith("add_header Content-Security-Policy"))
    .join("")

/** The directives of a Content-Security-Policy header line, e.g. ["style-src 'self'", "img-src ..."]. */
const cspDirectives = (header: string) =>
  header
    .replace(/^add_header Content-Security-Policy "/, "")
    .replace(/" always;$/, "")
    .split("; ")

/** The add_header lines of a snippet other than the CSP one. */
const plain = (snippet: string) =>
  snippet.split("\n").filter((line) => /^add_header (?!Content-Security-Policy)/.test(line))

/** Names of the `${VAR}` placeholders in a text. */
const placeholders = (text: string) => new Set([...text.matchAll(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map((m) => m[1]!))

/** The `location` blocks of an nginx config, matcher -> body (bodies may nest braces, e.g. `types { }`). */
function locations(conf: string): Map<string, string> {
  const blocks = new Map<string, string>()
  for (const match of conf.matchAll(/^[ \t]*location\s+([^{]+?)\s*\{/gm)) {
    const start = match.index! + match[0].length
    let depth = 1
    let end = start
    while (depth > 0 && end < conf.length) {
      const char = conf[end++]
      if (char === "{") depth++
      else if (char === "}") depth--
    }
    blocks.set(match[1]!, conf.slice(start, end - 1))
  }
  return blocks
}

/** The variable list a shell variable of entrypoint.sh hands to envsubst, e.g. NGINX_VARS='${A} ${B}'. */
function entrypointVarList(name: string): Set<string> {
  const match = new RegExp(`^${name}='([^']*)'$`, "m").exec(read("entrypoint.sh"))
  if (!match) throw new Error(`${name} not found in entrypoint.sh`)
  return placeholders(match[1]!)
}

describe("Docker build inputs", () => {
  it("dockerfile exists", () => {
    expect(fs.existsSync(path.join(deployDir, "Dockerfile"))).toBe(true)
  })

  it("nginx config exists", () => {
    expect(fs.existsSync(path.join(deployDir, "nginx.conf"))).toBe(true)
  })

  it("entrypoint script exists", () => {
    expect(fs.existsSync(path.join(deployDir, "entrypoint.sh"))).toBe(true)
  })

  it("nginx site configs exist", () => {
    const sites = ["default", "sp", "app", "id", "share", "staff", "admin", "lms", "library", "api", "mcp", "root"]
    for (const site of sites) {
      expect(fs.existsSync(path.join(sitesDir, `${site}.conf`))).toBe(true)
    }
  })

  it("nginx snippets exist", () => {
    const snippets = [
      "security-headers",
      "security-headers-library",
      "proxy-backend",
      "proxy-hydra",
      "proxy-identity",
      "proxy-bot",
      "health",
    ]
    for (const snippet of snippets) {
      expect(fs.existsSync(path.join(snippetsDir, `${snippet}.conf`))).toBe(true)
    }
  })

  it("env.js template exists", () => {
    expect(fs.existsSync(path.join(deployDir, "env.js.template"))).toBe(true)
  })

  it("csp-hash script exists", () => {
    expect(fs.existsSync(path.join(deployDir, "csp-hash.ts"))).toBe(true)
  })

  it("dockerfile copies the templates (not into conf.d) and the csp-hash script into the build stage", () => {
    const dockerfile = read("Dockerfile")
    expect(dockerfile).toContain("COPY deploy/sites/ /app/templates/sites/")
    expect(dockerfile).toContain("COPY deploy/snippets/ /app/templates/snippets/")
    expect(dockerfile).toContain("COPY deploy/csp-hash.ts")
    expect(dockerfile).not.toMatch(/\/etc\/nginx\/(conf\.d|snippets)\/?\s*$/m)
  })

  it("both dockerfiles put the library export into /srv/library and the prebuilt context allows it", () => {
    expect(read("Dockerfile")).toContain("COPY --from=builder /app/apps/library/out /srv/library\n")
    expect(read("Dockerfile.prebuilt")).toContain("COPY apps/library/out /srv/library\n")
    expect(read("Dockerfile.prebuilt.dockerignore")).toContain("!apps/library/out\n")
  })

  it("dockerfile bakes the app version into the build before next build runs", () => {
    const dockerfile = read("Dockerfile")
    const arg = dockerfile.indexOf("ARG NEXT_PUBLIC_APP_VERSION=1.0.0")
    expect(arg).toBeGreaterThan(-1)
    expect(dockerfile).toContain("ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}")
    expect(dockerfile.indexOf("ENV NEXT_PUBLIC_APP_VERSION=")).toBeGreaterThan(arg)
    expect(dockerfile.indexOf("ENV NEXT_PUBLIC_APP_VERSION=")).toBeLessThan(dockerfile.indexOf("RUN bun run build"))
  })
})

describe("nginx.conf", () => {
  it("uses only rates nginx accepts (r/s and r/m)", () => {
    const rates = [...read("nginx.conf").matchAll(/rate=(\S+?);/g)].map((m) => m[1]!)
    for (const rate of rates) expect(rate).toMatch(/^\d+r\/[sm]$/)
  })

  it("leaves rate limiting to the backend", () => {
    expect(read("nginx.conf")).not.toMatch(/^\s*limit_req_zone/m)
  })
})

describe("templates", () => {
  it("every ${VAR} in the nginx templates is in the explicit envsubst list of entrypoint.sh", () => {
    const listed = entrypointVarList("NGINX_VARS")
    for (const dir of [sitesDir, snippetsDir]) {
      for (const file of confFiles(dir)) {
        for (const name of placeholders(fs.readFileSync(path.join(dir, file), "utf-8"))) {
          expect({ file, name, listed: listed.has(name) }).toEqual({ file, name, listed: true })
        }
      }
    }
  })

  it("every ${VAR} in env.js.template is in the env.js list of entrypoint.sh", () => {
    const listed = entrypointVarList("ENV_JS_VARS")
    for (const name of placeholders(read("env.js.template"))) {
      expect({ name, listed: listed.has(name) }).toEqual({ name, listed: true })
    }
  })

  it("every server listens on LISTEN_PORT and answers /health", () => {
    for (const file of confFiles(sitesDir)) {
      const text = fs.readFileSync(path.join(sitesDir, file), "utf-8")
      expect(text).not.toMatch(/listen\s+(\[::\]:)?\d+/)
      expect(text).toContain("listen ${LISTEN_PORT}")
      expect(text).toContain("include /etc/nginx/snippets/health.conf;")
    }
    const health = read("snippets", "health.conf")
    expect(health).toContain("location = /health")
    expect(health).toContain("return 200")
  })

  it("security headers: no script-src or default-src in the header, connect-src from CSP_CONNECT_SRC", () => {
    const csp = cspHeader(read("snippets", "security-headers.conf"))
    expect(csp).not.toContain("script-src")
    expect(csp).not.toContain("default-src")
    expect(csp).not.toContain("https://telegram.org")
    expect(csp).toContain("connect-src ${CSP_CONNECT_SRC};")
    expect(csp).toContain("frame-ancestors 'self' https://web.telegram.org")
    expect(csp).toContain("object-src 'none'")
  })

  it("security headers of the library: the same as the others plus the reader's img-src, connect-src and worker-src", () => {
    const library = read("snippets", "security-headers-library.conf")
    const csp = cspHeader(library)
    expect(csp).not.toContain("script-src")
    expect(csp).not.toContain("default-src")
    expect(csp).not.toContain("frame-src")
    expect(csp).not.toContain("https://telegram.org")
    // covers hot-linked from UniLibrary, covers and files from the storage origin
    expect(csp).toContain("img-src ${CSP_IMG_SRC} ${IHSP_STORAGE_ORIGIN} https://api.unilibrary.uz;")
    // presigned PDF/EPUB downloads with HTTP Range
    expect(csp).toContain("connect-src ${CSP_CONNECT_SRC} ${IHSP_STORAGE_ORIGIN};")
    expect(csp).toContain("worker-src 'self' blob:;")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-ancestors 'self' https://web.telegram.org")
    // every other directive is the one of the other sites
    const others = new Map(
      cspDirectives(cspHeader(read("snippets", "security-headers.conf"))).map((d) => [d.split(" ")[0]!, d]),
    )
    const ownDirectives = new Map(cspDirectives(csp).map((d) => [d.split(" ")[0]!, d]))
    const changed = ["img-src", "connect-src", "worker-src"]
    expect([...ownDirectives.keys()].filter((name) => !others.has(name))).toEqual(["worker-src"])
    for (const [name, directive] of others) {
      if (!changed.includes(name)) expect({ name, directive: ownDirectives.get(name) }).toEqual({ name, directive })
    }
  })

  it("the library snippet sends the same plain security headers as the shared one", () => {
    expect(plain(read("snippets", "security-headers-library.conf"))).toEqual(
      plain(read("snippets", "security-headers.conf")),
    )
    expect(plain(read("snippets", "security-headers.conf"))).toHaveLength(4)
  })

  it("api.conf sends identity, oauth and admin users/teachers/audit to identity", () => {
    const api = read("sites", "api.conf")
    expect(api).toMatch(/location ~ \^\/v1\/\(id\|oauth\)\/ \{\s*include [^;]*proxy-identity\.conf;/)
    expect(api).toMatch(
      /location ~ \^\/v1\/admin\/\(users\|teachers\|audit\)\(\/\|\$\) \{\s*include [^;]*proxy-identity\.conf;/,
    )
    expect(read("snippets", "proxy-identity.conf")).toContain("proxy_pass http://${IDENTITY_UPSTREAM};")
  })

  it("api.conf keeps the teacher profile composition endpoint in the api process (as the edge nginx does)", () => {
    const api = read("sites", "api.conf")
    const profile = api.indexOf("/v1/admin/teachers/[^/]+/profile$")
    const admin = api.indexOf("/v1/admin/(users|teachers|audit)")
    expect(profile).toBeGreaterThan(-1)
    expect(profile).toBeLessThan(admin)
    expect(api).toMatch(/profile\$ \{\s*include [^;]*proxy-backend\.conf;/)
  })

  it("lms.conf rewrites invite links /join/{code} to /join/?code={code}", () => {
    const lms = read("sites", "lms.conf")
    expect(lms).toContain("rewrite ^/join/([A-Za-z0-9_-]+)/?$ /join/?code=$1 last;")
    // the rewrite pattern, as nginx evaluates it
    const pattern = /^\/join\/([A-Za-z0-9_-]+)\/?$/
    expect("/join/Ab_9-x".replace(pattern, "/join/?code=$1")).toBe("/join/?code=Ab_9-x")
    expect("/join/Ab_9-x/".replace(pattern, "/join/?code=$1")).toBe("/join/?code=Ab_9-x")
    expect(pattern.test("/join/")).toBe(false)
    expect(pattern.test("/join/a/b")).toBe(false)
  })

  it("share.conf serves /ai/env.js with no-store", () => {
    expect(read("sites", "share.conf")).toMatch(/location = \/ai\/env\.js \{[^}]*Cache-Control "no-store"/)
  })

  it("env.js.template carries the app mode, the PWA url and the library url", () => {
    const template = read("env.js.template")
    expect(template).toContain('APP_MODE: "${APP_MODE}",')
    expect(template).toContain('APP_URL: "${IHSP_WEB_APP_URL}",')
    expect(template).toContain('LIBRARY_URL: "${IHSP_WEB_LIBRARY_URL}",')
  })
})

describe("library.conf (library host)", () => {
  const library = read("sites", "library.conf")
  const blocks = locations(library)
  const block = (matcher: string) => {
    const body = blocks.get(matcher)
    if (body === undefined) throw new Error(`library.conf has no location ${matcher}`)
    return body
  }
  const securityHeaders = "include /etc/nginx/snippets/security-headers-library.conf;"

  it("serves /srv/library on APP_HOST_LIBRARY with the library's security headers", () => {
    expect(library).toContain("server_name ${APP_HOST_LIBRARY};")
    expect(library).toContain("root /srv/library;")
    expect(library).toContain(securityHeaders)
    // never the shared policy: two Content-Security-Policy headers would be intersected
    expect(library).not.toContain("snippets/security-headers.conf")
  })

  it("serves env.js with no-store and /_next/static/ as immutable for a year", () => {
    expect(block("= /env.js")).toContain('add_header Cache-Control "no-store";')
    expect(block("/_next/static/")).toContain('add_header Cache-Control "public, max-age=31536000, immutable";')
  })

  it("serves the module worker (.mjs) as JavaScript, which nginx's mime.types does not know", () => {
    const hashed = block("~ ^/_next/static/.+\\.mjs$")
    const plain = block("~ \\.mjs$")
    for (const body of [hashed, plain]) expect(body).toContain("types { text/javascript mjs; }")
    expect(hashed).toContain("immutable")
    expect(plain).toContain('add_header Cache-Control "no-cache";')
    // the hashed rule comes first: the first matching regex location wins
    expect(library.indexOf("^/_next/static/.+")).toBeLessThan(library.indexOf("location ~ \\.mjs$"))
  })

  it("serves every page as a file or a directory index and answers 404 with the 404 page", () => {
    expect(block("/")).toContain("try_files $uri $uri/ =404;")
    expect(library).toContain("error_page 404 /404.html;")
  })

  it("includes the security headers in every location that sets Cache-Control", () => {
    // add_header in a location drops the headers inherited from the server block
    const withCacheControl = [...blocks].filter(([, body]) => body.includes("add_header Cache-Control"))
    expect(withCacheControl.map(([matcher]) => matcher).toSorted()).toEqual(
      [
        "= /env.js",
        "= /sw.js",
        "= /manifest.webmanifest",
        "/icons/",
        "/_next/static/",
        "~ ^/_next/static/.+\\.mjs$",
        "~ \\.mjs$",
      ].toSorted(),
    )
    for (const [matcher, body] of withCacheControl) {
      expect({ matcher, secured: body.includes(securityHeaders) }).toEqual({ matcher, secured: true })
    }
  })

  it("serves the service worker and the manifest of the installable library, and proxies nothing (the edge sends /b/ & co. to the api)", () => {
    expect(library).toMatch(/location = \/sw\.js \{[\s\S]{0,200}?Cache-Control "no-cache"/)
    expect(library).toMatch(/location = \/manifest\.webmanifest \{[\s\S]{0,200}?Cache-Control "no-cache"/)
    expect(library).not.toContain("proxy_pass")
    expect(library).not.toMatch(/snippets\/proxy-/)
    expect(library).not.toContain("_UPSTREAM")
  })
})

describe("app.conf (installable PWA host)", () => {
  const app = read("sites", "app.conf")
  const blocks = locations(app)
  const block = (matcher: string) => {
    const body = blocks.get(matcher)
    if (body === undefined) throw new Error(`app.conf has no location ${matcher}`)
    return body
  }
  const securityHeaders = "include /etc/nginx/snippets/security-headers.conf;"

  it("serves the sp build on APP_HOST_APP", () => {
    expect(app).toContain("server_name ${APP_HOST_APP};")
    expect(app).toContain("root /srv/sp;")
    expect(app).toContain(securityHeaders)
  })

  it("serves its own env.js from outside the static export, never the one of the sp host", () => {
    const env = block("= /env.js")
    expect(env).toContain("alias /srv/app-env/env.js;")
    expect(env).toContain('add_header Cache-Control "no-store";')
    // where entrypoint.sh renders it
    expect(read("entrypoint.sh")).toContain('"$SRV_DIR/app-env/env.js"')
  })

  it("serves /_next/static/ as immutable for a year", () => {
    expect(block("/_next/static/")).toContain('add_header Cache-Control "public, max-age=31536000, immutable";')
  })

  it("serves the service worker with no-cache, scope / and a JavaScript type", () => {
    const worker = block("= /sw.js")
    expect(worker).toContain('add_header Cache-Control "no-cache";')
    expect(worker).toContain('add_header Service-Worker-Allowed "/";')
    expect(worker).toContain("default_type application/javascript;")
  })

  it("serves the manifest with no-cache and the manifest type", () => {
    const manifest = block("= /manifest.webmanifest")
    expect(manifest).toContain('add_header Cache-Control "no-cache";')
    expect(manifest).toContain("types { }")
    expect(manifest).toContain("default_type application/manifest+json;")
  })

  it("serves the icons for a day", () => {
    expect(block("/icons/")).toContain('add_header Cache-Control "public, max-age=86400";')
  })

  it("revalidates the HTML on every load so the service worker can keep it fresh", () => {
    const html = block("/")
    expect(html).toContain("try_files $uri $uri/ =404;")
    expect(html).toContain('add_header Cache-Control "no-cache";')
    expect(app).toContain("error_page 404 /404.html;")
  })

  it("includes the security headers in every location that sets Cache-Control", () => {
    // add_header in a location drops the headers inherited from the server block
    const withCacheControl = [...blocks].filter(([, body]) => body.includes("add_header Cache-Control"))
    expect(withCacheControl.map(([matcher]) => matcher).toSorted()).toEqual(
      ["/", "/_next/static/", "/icons/", "= /env.js", "= /manifest.webmanifest", "= /sw.js"].toSorted(),
    )
    for (const [matcher, body] of withCacheControl) {
      expect({ matcher, secured: body.includes(securityHeaders) }).toEqual({ matcher, secured: true })
    }
  })

  it("proxies nothing: it only serves files", () => {
    expect(app).not.toContain("proxy_pass")
    expect(app).not.toMatch(/snippets\/proxy-/)
    expect(app).not.toContain("_UPSTREAM")
  })
})

// Renders the templates with the real entrypoint.sh (and the real envsubst) into a temp dir; nginx is a stub.
// One run starts bash and one envsubst per template and env.js (a few seconds on a busy machine), and some
// tests run it twice: more than bun's default 5 s.
setDefaultTimeout(30_000)
const haveTools = Boolean(Bun.which("envsubst")) && Boolean(Bun.which("bash"))
const tempDirs: string[] = []
afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

function runEntrypoint(env: Record<string, string>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ihsp-entrypoint-"))
  tempDirs.push(root)
  const bin = path.join(root, "bin")
  const nginxDir = path.join(root, "nginx")
  const srv = path.join(root, "srv")
  const templates = path.join(root, "templates")
  fs.mkdirSync(bin)
  fs.mkdirSync(path.join(nginxDir, "conf.d"), { recursive: true })
  fs.writeFileSync(path.join(nginxDir, "conf.d", "default.conf"), "# stale file from the base image\n")
  for (const app of ["id", "sp", "staff", "admin", "lms", "library", "share/ai"])
    fs.mkdirSync(path.join(srv, app), { recursive: true })
  fs.mkdirSync(templates)
  fs.symlinkSync(sitesDir, path.join(templates, "sites"))
  fs.symlinkSync(snippetsDir, path.join(templates, "snippets"))
  const nginxLog = path.join(root, "nginx.log")
  fs.writeFileSync(path.join(bin, "nginx"), `#!/bin/sh\necho "$@" >> '${nginxLog}'\n`, { mode: 0o755 })

  const result = Bun.spawnSync(["bash", path.join(deployDir, "entrypoint.sh")], {
    env: {
      PATH: `${bin}:${process.env.PATH ?? "/usr/bin:/bin"}`,
      TEMPLATES_DIR: templates,
      NGINX_DIR: nginxDir,
      SRV_DIR: srv,
      ENV_JS_TEMPLATE: path.join(deployDir, "env.js.template"),
      ...env,
    },
  })
  const file = (...parts: string[]) => fs.readFileSync(path.join(root, ...parts), "utf-8")
  return {
    exitCode: result.exitCode,
    stderr: result.stderr.toString(),
    nginxCalls: fs.existsSync(nginxLog) ? file("nginx.log").trim().split("\n") : [],
    conf: (name: string) => file("nginx", "conf.d", name),
    snippet: (name: string) => file("nginx", "snippets", name),
    exists: (...parts: string[]) => fs.existsSync(path.join(root, ...parts)),
    envJs: (...parts: string[]) => file("srv", ...parts, "env.js"),
  }
}

describe.skipIf(!haveTools)("entrypoint.sh rendering", () => {
  it("renders every template with defaults, exports the defaults and keeps nginx variables", () => {
    const run = runEntrypoint({})
    expect(run.stderr).toBe("")
    expect(run.exitCode).toBe(0)
    expect(run.nginxCalls).toEqual(["-t", "-g daemon off;"])

    expect(run.exists("nginx", "conf.d", "default.conf")).toBe(true)
    expect(run.conf("default.conf")).not.toContain("stale file")
    expect(run.conf("sp.conf")).toContain("listen 80;")
    expect(run.conf("sp.conf")).toContain("server_name sp.localhost;")
    expect(run.conf("app.conf")).toContain("listen 80;")
    expect(run.conf("app.conf")).toContain("server_name app.localhost;")
    expect(run.conf("library.conf")).toContain("listen 80;")
    expect(run.conf("library.conf")).toContain("server_name library.localhost;")
    expect(run.snippet("proxy-hydra.conf")).toContain("proxy_pass http://hydra:4444;")
    expect(run.snippet("proxy-identity.conf")).toContain("proxy_pass http://identity:8001;")
    expect(run.snippet("proxy-bot.conf")).toContain("proxy_pass http://bot:8002;")
    // BACKEND_UPSTREAM defaults to API_UPSTREAM
    expect(run.snippet("proxy-backend.conf")).toContain("proxy_pass http://api:8000;")
    // nginx's own variables are left alone
    expect(run.snippet("proxy-backend.conf")).toContain("proxy_set_header Host $host;")
    expect(run.snippet("proxy-backend.conf")).toContain("proxy_set_header X-Forwarded-For $remote_addr;")
    expect(run.conf("root.conf")).toContain("return 302 http://localhost:3002/;")

    // defaults reach env.js (they must be exported for envsubst)
    expect(run.envJs("sp")).toContain('API_URL: "http://localhost:8000"')
    expect(run.envJs("sp")).toContain('OAUTH_CLIENT_ID: "sp"')
    expect(run.envJs("share/ai")).toContain('OAUTH_CLIENT_ID: "share"')
    expect(run.envJs("sp")).toContain('APP_URL: "http://localhost:3007"')
    expect(run.envJs("sp")).toContain('LIBRARY_URL: "http://localhost:3008"')
  })

  it("renders the app host's own env.js (pwa mode, client app) outside the export, the others in sp mode", () => {
    const run = runEntrypoint({})
    expect(run.exitCode).toBe(0)
    expect(run.envJs("app-env")).toContain('APP_MODE: "pwa"')
    expect(run.envJs("app-env")).toContain('OAUTH_CLIENT_ID: "app"')
    expect(run.envJs("app-env")).toContain('APP_URL: "http://localhost:3007"')
    expect(run.envJs("app-env")).toContain('API_URL: "http://localhost:8000"')
    // the sp export keeps its own file
    expect(run.envJs("sp")).toContain('APP_MODE: "sp"')
    expect(run.envJs("sp")).toContain('OAUTH_CLIENT_ID: "sp"')
    for (const app of ["id", "staff", "admin", "lms", "library", "share/ai"]) {
      expect(run.envJs(app)).toContain('APP_MODE: "sp"')
    }
    expect(run.exists("srv", "app")).toBe(false)
  })

  it("PWA_APPS turns the listed apps into installable ones on their own host, and only those", () => {
    const run = runEntrypoint({ PWA_APPS: "lms library,staff admin sp id" })
    expect(run.exitCode).toBe(0)
    for (const app of ["lms", "library", "staff", "admin"]) {
      expect(run.envJs(app)).toContain('APP_MODE: "pwa"')
      expect(run.envJs(app)).toContain(`OAUTH_CLIENT_ID: "${app}"`)
    }
    // the student app is installed from the app host, and id/share are not installable
    expect(run.envJs("sp")).toContain('APP_MODE: "sp"')
    expect(run.envJs("id")).toContain('APP_MODE: "sp"')
    expect(run.envJs("share/ai")).toContain('APP_MODE: "sp"')
    expect(run.envJs("app-env")).toContain('APP_MODE: "pwa"')
    expect(run.envJs("app-env")).toContain('OAUTH_CLIENT_ID: "app"')
  })

  it.each(["lms", "staff", "admin"])(
    "%s.conf revalidates the service worker and the manifest and never caches env.js",
    (app) => {
      const conf = read("sites", `${app}.conf`)
      expect(conf).toMatch(/location = \/env\.js \{[^}]*Cache-Control "no-store"/)
      expect(conf).toMatch(
        /location = \/sw\.js \{[\s\S]{0,200}?Cache-Control "no-cache"[\s\S]{0,80}?Service-Worker-Allowed "\/"/,
      )
      expect(conf).toMatch(/location = \/manifest\.webmanifest \{[\s\S]{0,200}?Cache-Control "no-cache"/)
    },
  )

  it("treats an unset PWA_APPS as none (no unbound variable under set -u)", () => {
    const run = runEntrypoint({})
    expect(run.stderr).not.toContain("unbound variable")
    expect(run.exitCode).toBe(0)
    for (const app of ["lms", "library", "staff", "admin"]) expect(run.envJs(app)).toContain('APP_MODE: "sp"')
  })

  it("PWA_APPS lists one app at a time", () => {
    const run = runEntrypoint({ PWA_APPS: "lms" })
    expect(run.exitCode).toBe(0)
    expect(run.envJs("lms")).toContain('APP_MODE: "pwa"')
    for (const app of ["library", "staff", "admin"]) expect(run.envJs(app)).toContain('APP_MODE: "sp"')
  })

  it("renders the app host and URL from APP_HOST_APP and IHSP_WEB_APP_URL", () => {
    const run = runEntrypoint({ APP_HOST_APP: "app.example.test", IHSP_WEB_APP_URL: "https://app.example.test" })
    expect(run.exitCode).toBe(0)
    expect(run.conf("app.conf")).toContain("server_name app.example.test;")
    expect(run.conf("app.conf")).not.toContain("app.localhost")
    expect(run.envJs("app-env")).toContain('APP_URL: "https://app.example.test"')
    expect(run.envJs("sp")).toContain('APP_URL: "https://app.example.test"')
  })

  it("renders the library's own env.js (client library, sp mode) into /srv/library", () => {
    const run = runEntrypoint({})
    expect(run.exitCode).toBe(0)
    expect(run.envJs("library")).toContain('OAUTH_CLIENT_ID: "library"')
    expect(run.envJs("library")).toContain('APP_MODE: "sp"')
    expect(run.envJs("library")).toContain('LIBRARY_URL: "http://localhost:3008"')
    expect(run.envJs("library")).toContain('API_URL: "http://localhost:8000"')
    expect(run.envJs("library")).toContain('STORAGE_ORIGIN: "http://localhost:8000"')
    // the other apps keep their own client ids
    expect(run.envJs("lms")).toContain('OAUTH_CLIENT_ID: "lms"')
  })

  it("renders the library host and URL from APP_HOST_LIBRARY and IHSP_WEB_LIBRARY_URL", () => {
    const run = runEntrypoint({
      APP_HOST_LIBRARY: "library.example.test",
      IHSP_WEB_LIBRARY_URL: "https://library.example.test",
    })
    expect(run.exitCode).toBe(0)
    expect(run.conf("library.conf")).toContain("server_name library.example.test;")
    expect(run.conf("library.conf")).not.toContain("library.localhost")
    expect(run.envJs("library")).toContain('LIBRARY_URL: "https://library.example.test"')
    expect(run.envJs("sp")).toContain('LIBRARY_URL: "https://library.example.test"')
    expect(run.envJs("app-env")).toContain('LIBRARY_URL: "https://library.example.test"')
  })

  it("renders nothing with a leftover ${...}", () => {
    const run = runEntrypoint({})
    for (const file of confFiles(sitesDir)) expect(run.conf(file)).not.toMatch(/\$\{/)
    for (const file of confFiles(snippetsDir)) expect(run.snippet(file)).not.toMatch(/\$\{/)
  })

  it("uses CSP_CONNECT_SRC (default 'self' https:) and LISTEN_PORT", () => {
    const defaults = runEntrypoint({})
    expect(defaults.snippet("security-headers.conf")).toContain("connect-src 'self' https:;")
    expect(cspHeader(defaults.snippet("security-headers.conf"))).not.toContain("script-src")

    const local = runEntrypoint({ CSP_CONNECT_SRC: "'self' http://api.localhost", LISTEN_PORT: "8080" })
    expect(local.exitCode).toBe(0)
    expect(local.snippet("security-headers.conf")).toContain("connect-src 'self' http://api.localhost;")
    for (const file of confFiles(sitesDir)) expect(local.conf(file)).toContain("listen 8080")
  })

  it("renders the library CSP from CSP_IMG_SRC, CSP_CONNECT_SRC and the storage origin", () => {
    const defaults = runEntrypoint({})
    const header = cspHeader(defaults.snippet("security-headers-library.conf"))
    expect(header).toContain("img-src 'self' data: blob: https: http://localhost:8000 https://api.unilibrary.uz;")
    expect(header).toContain("connect-src 'self' https: http://localhost:8000;")
    expect(header).toContain("worker-src 'self' blob:;")

    const prod = runEntrypoint({
      CSP_CONNECT_SRC: "'self' https://api.ihsu.test https://storage.ihsu.test",
      CSP_IMG_SRC: "'self' data: blob: https://storage.ihsu.test",
      IHSP_STORAGE_ORIGIN: "https://storage.ihsu.test",
    })
    const prodHeader = cspHeader(prod.snippet("security-headers-library.conf"))
    expect(prodHeader).toContain(
      "img-src 'self' data: blob: https://storage.ihsu.test https://storage.ihsu.test https://api.unilibrary.uz;",
    )
    expect(prodHeader).toContain(
      "connect-src 'self' https://api.ihsu.test https://storage.ihsu.test https://storage.ihsu.test;",
    )
    // the other sites keep the shared policy: no UniLibrary, no worker-src
    const shared = cspHeader(prod.snippet("security-headers.conf"))
    expect(shared).not.toContain("unilibrary")
    expect(shared).not.toContain("worker-src")
  })

  it("renders host names, upstreams and env.js values from the environment", () => {
    const run = runEntrypoint({
      APP_ENV: "dev",
      APP_HOST_SP: "sp.example.test",
      API_HOST: "api.example.test",
      IDENTITY_UPSTREAM: "identity.test:8001",
      API_UPSTREAM: "api.test:8000",
      BACKEND_UPSTREAM: "backend.test:9000",
      IHSP_WEB_API_URL: "http://api.example.test",
    })
    expect(run.exitCode).toBe(0)
    expect(run.conf("sp.conf")).toContain("server_name sp.example.test;")
    expect(run.conf("api.conf")).toContain("server_name api.example.test;")
    expect(run.snippet("proxy-identity.conf")).toContain("proxy_pass http://identity.test:8001;")
    expect(run.snippet("proxy-backend.conf")).toContain("proxy_pass http://backend.test:9000;")
    expect(run.conf("share.conf")).toContain("proxy_pass http://api.test:8000;")
    expect(run.envJs("sp")).toContain('APP_ENV: "dev"')
    expect(run.envJs("sp")).toContain('API_URL: "http://api.example.test"')
  })

  it("rejects an invalid LISTEN_PORT before starting nginx", () => {
    const run = runEntrypoint({ LISTEN_PORT: "http" })
    expect(run.exitCode).not.toBe(0)
    expect(run.stderr).toContain("LISTEN_PORT")
    expect(run.nginxCalls).toEqual([])
  })
})
