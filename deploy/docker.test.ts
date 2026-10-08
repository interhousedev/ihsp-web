import { afterEach, describe, expect, it } from "bun:test"
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

/** Names of the `${VAR}` placeholders in a text. */
const placeholders = (text: string) => new Set([...text.matchAll(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map((m) => m[1]!))

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
    const sites = ["default", "sp", "id", "share", "staff", "admin", "lms", "api", "mcp", "root"]
    for (const site of sites) {
      expect(fs.existsSync(path.join(sitesDir, `${site}.conf`))).toBe(true)
    }
  })

  it("nginx snippets exist", () => {
    const snippets = ["security-headers", "proxy-backend", "proxy-hydra", "proxy-identity", "proxy-bot", "health"]
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
})

// Renders the templates with the real entrypoint.sh (and the real envsubst) into a temp dir; nginx is a stub.
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
  for (const app of ["id", "sp", "staff", "admin", "lms", "share/ai"])
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
