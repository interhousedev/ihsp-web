#!/bin/bash
set -euo pipefail

# ============================================================================
# IHSP web image: renders runtime config and starts nginx
# ============================================================================
#
# At every container start:
#   1. every variable below gets its default if unset (development values: *.localhost),
#   2. env.js is rendered for each app from /app/env.js.template,
#   3. every nginx template (/app/templates/sites, /app/templates/snippets) is rendered with
#      envsubst and an explicit variable list (so nginx's own $host, $remote_addr, ... stay intact)
#      into /etc/nginx/conf.d and /etc/nginx/snippets,
#   4. `nginx -t`, then nginx in the foreground.
#
# SERVER:
#   LISTEN_PORT          - Port nginx listens on (default: 80)
#
# SITE HOSTNAMES:
#   APP_HOST_ID          - ID/OAuth service host (default: id.localhost)
#   APP_HOST_SP          - Student portal host (default: sp.localhost)
#   APP_HOST_APP         - Installable PWA host: the sp build with its own env.js (default: app.localhost)
#   APP_HOST_STAFF      - Staff portal host (default: staff.localhost)
#   APP_HOST_ADMIN       - Admin platform host (default: admin.localhost)
#   APP_HOST_LMS         - LMS platform host (default: lms.localhost)
#   APP_HOST_LIBRARY     - Library host (default: library.localhost)
#   APP_HOST_SHARE       - Public share viewer host (default: s.localhost)
#   API_HOST             - API service host (default: api.localhost)
#   MCP_HOST             - MCP server host (default: mcp.localhost)
#   ROOT_HOST            - Root domain for room pages (default: localhost)
#
# UPSTREAM SERVICES (host:port; nginx resolves them when it starts, so they must resolve):
#   HYDRA_UPSTREAM       - Ory Hydra public port (default: hydra:4444)
#   IDENTITY_UPSTREAM    - Identity process (default: identity:8001)
#   API_UPSTREAM         - API process (default: api:8000)
#   BOT_UPSTREAM         - Telegram bot process (default: bot:8002)
#   BACKEND_UPSTREAM     - Catch-all backend of the api. host (default: $API_UPSTREAM)
#
# CONTENT-SECURITY-POLICY HEADER (script-src is NOT here: it is the per-page <meta> from csp-hash.ts):
#   CSP_CONNECT_SRC      - connect-src sources (default: 'self' https:)
#   CSP_IMG_SRC          - img-src sources (default: 'self' data: blob: https:)
#
# APP CONFIGURATION (rendered into window.__ENV__ via env.js):
#   APP_ENV                  - "dev" or "prod" (default: prod)
#   IHSP_WEB_API_URL         - API root for client (default: http://localhost:8000)
#   IHSP_WEB_ID_URL          - ID app base for login redirects (default: http://localhost:3001)
#   IHSP_WEB_HYDRA_URL       - OAuth provider base (default: http://localhost:4444)
#   IHSP_WEB_SP_URL          - Student app URL (default: http://localhost:3002)
#   IHSP_WEB_APP_URL         - Installable PWA URL (default: http://localhost:3007)
#   IHSP_WEB_STAFF_URL      - Staff app URL (default: http://localhost:3003)
#   IHSP_WEB_ADMIN_URL       - Admin app URL (default: http://localhost:3004)
#   IHSP_WEB_LMS_URL         - LMS app URL (default: http://localhost:3005)
#   IHSP_WEB_LIBRARY_URL     - Library app URL (default: http://localhost:3008)
#   IHSP_WEB_SHARE_URL       - Share viewer base (default: http://localhost:3006/ai)
#   IHSP_WEB_SHORT_LINKS_URL - Short links host (default: http://localhost:3006)
#   IHSP_WEB_ROOMS_URL       - Room page backend (default: http://localhost:8000)
#   IHSP_WEB_MCP_URL         - MCP endpoint (default: http://localhost:8000/mcp)
#   IHSP_BOT_USERNAME        - Telegram bot username (default: ihspbot)
#   IHSP_STORAGE_ORIGIN      - File presigned URL origin (default: http://localhost:8000); also in the
#                              img-src and connect-src of the library site's CSP header
#
#   PWA_APPS                 - Apps that run as installable apps on their own host (APP_MODE "pwa" in their
#                              env.js), space or comma separated, from: lms library staff admin
#                              (default: none). The student app is installed from the PWA host (APP_HOST_APP).
#
# The apps differ in two env.js values that are not variables of this image: OAUTH_CLIENT_ID is the
# app name, and APP_MODE is "sp" (a plain website) for every app but the PWA host, which gets "pwa" (and
# client "app"), and the apps listed in PWA_APPS, which get "pwa" with their own client.
#
# Every ${VAR} used in deploy/env.js.template, deploy/sites/* and deploy/snippets/* must be in
# ENV_JS_VARS / NGINX_VARS below (deploy/docker.test.ts checks it).
# ============================================================================

TEMPLATES_DIR="${TEMPLATES_DIR:-/app/templates}"
NGINX_DIR="${NGINX_DIR:-/etc/nginx}"
SRV_DIR="${SRV_DIR:-/srv}"
ENV_JS_TEMPLATE="${ENV_JS_TEMPLATE:-/app/env.js.template}"

# default NAME VALUE: export NAME (to VALUE when unset or empty). Plain `: "${X:=v}"` would
# not export it, and envsubst only sees exported variables.
default() {
  local name="$1" value="$2"
  export "$name=${!name:-$value}"
}

default APP_ENV prod
default LISTEN_PORT 80
default APP_HOST_ID id.localhost
default APP_HOST_SP sp.localhost
default APP_HOST_APP app.localhost
default APP_HOST_STAFF staff.localhost
default APP_HOST_ADMIN admin.localhost
default APP_HOST_LMS lms.localhost
default APP_HOST_LIBRARY library.localhost
default APP_HOST_SHARE s.localhost
default API_HOST api.localhost
default MCP_HOST mcp.localhost
default ROOT_HOST localhost
default HYDRA_UPSTREAM hydra:4444
default IDENTITY_UPSTREAM identity:8001
default API_UPSTREAM api:8000
default BOT_UPSTREAM bot:8002
default BACKEND_UPSTREAM "$API_UPSTREAM"
default CSP_CONNECT_SRC "'self' https:"
default CSP_IMG_SRC "'self' data: blob: https:"
default IHSP_WEB_API_URL http://localhost:8000
default IHSP_WEB_ID_URL http://localhost:3001
default IHSP_WEB_HYDRA_URL http://localhost:4444
default IHSP_WEB_SP_URL http://localhost:3002
default IHSP_WEB_APP_URL http://localhost:3007
default IHSP_WEB_STAFF_URL http://localhost:3003
default IHSP_WEB_ADMIN_URL http://localhost:3004
default IHSP_WEB_LMS_URL http://localhost:3005
default IHSP_WEB_LIBRARY_URL http://localhost:3008
default IHSP_WEB_SHARE_URL http://localhost:3006/ai
default IHSP_WEB_SHORT_LINKS_URL http://localhost:3006
default IHSP_WEB_ROOMS_URL http://localhost:8000
default IHSP_WEB_MCP_URL http://localhost:8000/mcp
default IHSP_BOT_USERNAME ihspbot
default IHSP_STORAGE_ORIGIN http://localhost:8000

if ! [[ "$LISTEN_PORT" =~ ^[0-9]+$ ]] || [ "$LISTEN_PORT" -lt 1 ] || [ "$LISTEN_PORT" -gt 65535 ]; then
  echo "entrypoint: LISTEN_PORT must be a port number, got '$LISTEN_PORT'" >&2
  exit 1
fi

# Variables envsubst may replace. Single quotes on purpose: envsubst, not the shell, expands them.
# shellcheck disable=SC2016
ENV_JS_VARS='${APP_ENV} ${APP_MODE} ${IHSP_WEB_API_URL} ${IHSP_WEB_ID_URL} ${IHSP_WEB_HYDRA_URL} ${IHSP_WEB_SP_URL} ${IHSP_WEB_APP_URL} ${IHSP_WEB_STAFF_URL} ${IHSP_WEB_ADMIN_URL} ${IHSP_WEB_LMS_URL} ${IHSP_WEB_LIBRARY_URL} ${IHSP_WEB_SHARE_URL} ${IHSP_WEB_SHORT_LINKS_URL} ${IHSP_WEB_ROOMS_URL} ${IHSP_WEB_MCP_URL} ${IHSP_BOT_USERNAME} ${OAUTH_CLIENT_ID} ${IHSP_STORAGE_ORIGIN}'
# shellcheck disable=SC2016
NGINX_VARS='${LISTEN_PORT} ${APP_HOST_ID} ${APP_HOST_SP} ${APP_HOST_APP} ${APP_HOST_STAFF} ${APP_HOST_ADMIN} ${APP_HOST_LMS} ${APP_HOST_LIBRARY} ${APP_HOST_SHARE} ${API_HOST} ${MCP_HOST} ${ROOT_HOST} ${HYDRA_UPSTREAM} ${IDENTITY_UPSTREAM} ${API_UPSTREAM} ${BOT_UPSTREAM} ${BACKEND_UPSTREAM} ${CSP_CONNECT_SRC} ${CSP_IMG_SRC} ${IHSP_STORAGE_ORIGIN} ${IHSP_WEB_SP_URL}'

# app_mode APP: "pwa" for an app listed in PWA_APPS that can be installed on its own host, "sp" otherwise
PWA_APPS="${PWA_APPS:-}"
PWA_APPS="${PWA_APPS//,/ }"
app_mode() {
  case "$1" in
    lms | library | staff | admin)
      case " $PWA_APPS " in
        *" $1 "*) echo pwa ;;
        *) echo sp ;;
      esac
      ;;
    *) echo sp ;;
  esac
}

# Render env.js for each app (share loads /ai/env.js: its out/ is mounted at /srv/share/ai)
for app in id sp staff admin lms library; do
  APP_MODE="$(app_mode "$app")" OAUTH_CLIENT_ID="$app" envsubst "$ENV_JS_VARS" < "$ENV_JS_TEMPLATE" > "$SRV_DIR/$app/env.js"
done
APP_MODE="sp" OAUTH_CLIENT_ID="share" envsubst "$ENV_JS_VARS" < "$ENV_JS_TEMPLATE" > "$SRV_DIR/share/ai/env.js"

# The installable PWA is the sp build on a second host (sites/app.conf) with its own env.js. It is
# rendered outside the static export (/srv/sp keeps the env.js of the sp host).
mkdir -p "$SRV_DIR/app-env"
APP_MODE="pwa" OAUTH_CLIENT_ID="app" envsubst "$ENV_JS_VARS" < "$ENV_JS_TEMPLATE" > "$SRV_DIR/app-env/env.js"

# render_dir SRC_DIR DST_DIR: render every *.conf template of SRC_DIR into DST_DIR
render_dir() {
  local src="$1" dst="$2" file
  mkdir -p "$dst"
  for file in "$src"/*.conf; do
    envsubst "$NGINX_VARS" < "$file" > "$dst/$(basename "$file")"
  done
}

# Start from a clean slate (the base image ships conf.d/default.conf; a restart re-renders everything)
rm -f "$NGINX_DIR"/conf.d/*.conf
render_dir "$TEMPLATES_DIR/sites" "$NGINX_DIR/conf.d"
render_dir "$TEMPLATES_DIR/snippets" "$NGINX_DIR/snippets"

# A variable missing from NGINX_VARS would stay as a literal ${NAME} in the config
if grep -rnE '\$\{[A-Za-z_][A-Za-z0-9_]*\}' "$NGINX_DIR/conf.d" "$NGINX_DIR/snippets"; then
  echo "entrypoint: unrendered \${VARIABLE} left in the nginx config (see above)" >&2
  exit 1
fi

# Test nginx configuration
nginx -t

# Start nginx in foreground
exec nginx -g "daemon off;"
