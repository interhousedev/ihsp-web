#!/bin/sh
# ============================================================================
# IHSP web image: renders runtime config and starts nginx
# ============================================================================
#
# The image runs as the unprivileged nginx user (uid 101 of nginxinc/nginx-unprivileged). Everything
# it ships is root-owned and read-only for that user, so the runtime config is rendered under
# /tmp/ihsp: the one place nginx writes to (its pid file, its temp files, the rendered config and
# env.js). The paths of that directory are fixed in nginx.conf and in the site templates.
#
# At every container start:
#   1. every variable below gets its default if unset (development values: *.localhost),
#   2. env.js is rendered for each app from /app/env.js.template into $ENV_DIR/<app>/env.js,
#   3. every nginx template (/app/templates/sites, /app/templates/snippets) is rendered with
#      envsubst and an explicit variable list (so nginx's own $host, $remote_addr, ... stay intact)
#      into $NGINX_DIR/conf.d and $NGINX_DIR/snippets,
#   4. `nginx -t`, then nginx in the foreground.
#
# SERVER:
#   LISTEN_PORT          - Port nginx listens on, 1024 to 65535 (default: 8080; the container is unprivileged)
#
# SITE HOSTNAMES:
#   APP_HOST_ID          - ID/OAuth service host (default: id.localhost)
#   APP_HOST_MY          - Student app (my.iht) host (default: my.localhost)
#   APP_HOST_SP          - Deprecated alias of APP_HOST_MY, used only when APP_HOST_MY is unset
#   APP_HOST_APP         - Installable PWA host: the sp build with its own env.js (default: app.localhost)
#   APP_HOST_STAFF       - Staff portal host (default: staff.localhost)
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
#   IHSP_WEB_STAFF_URL       - Staff app URL (default: http://localhost:3003)
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
# RUNTIME PATHS (not configurable for the container; the nginx config names them):
#   NGINX_DIR, ENV_DIR   - Rendered nginx config and env.js (default: /tmp/ihsp/nginx and /tmp/ihsp/env)
#
# The apps differ in two env.js values that are not variables of this image: OAUTH_CLIENT_ID is the
# app name, and APP_MODE is "sp" (a plain website) for every app but the PWA host, which gets "pwa" (and
# client "app"), and the apps listed in PWA_APPS, which get "pwa" with their own client.
#
# Every ${VAR} used in deploy/env.js.template, deploy/sites/* and deploy/snippets/* must be in
# ENV_JS_VARS / NGINX_VARS below (deploy/docker.test.ts checks it).
# ============================================================================

# POSIX sh only (no bash in the image): -e stops at the first failing command, -u rejects unset names.
set -eu

TEMPLATES_DIR="${TEMPLATES_DIR:-/app/templates}"
ENV_JS_TEMPLATE="${ENV_JS_TEMPLATE:-/app/env.js.template}"
NGINX_DIR="${NGINX_DIR:-/tmp/ihsp/nginx}"
ENV_DIR="${ENV_DIR:-/tmp/ihsp/env}"

# default NAME VALUE: export NAME (to VALUE when unset or empty). A plain assignment would not
# export it, and envsubst only sees exported variables.
default() {
  eval "current=\${$1:-}"
  if [ -z "$current" ]; then
    current=$2
  fi
  export "$1=$current"
}

default APP_ENV prod
default LISTEN_PORT 8080
default APP_HOST_ID id.localhost
default APP_HOST_MY "${APP_HOST_SP:-my.localhost}"
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

port_ok=0
case "$LISTEN_PORT" in
  '' | *[!0-9]*) ;;
  *)
    if [ "$LISTEN_PORT" -ge 1024 ] && [ "$LISTEN_PORT" -le 65535 ]; then
      port_ok=1
    fi
    ;;
esac
if [ "$port_ok" -ne 1 ]; then
  echo "entrypoint: LISTEN_PORT must be a port from 1024 to 65535 (unprivileged container), got '$LISTEN_PORT'" >&2
  exit 1
fi

# Variables envsubst may replace. Single quotes on purpose: envsubst, not the shell, expands them.
# shellcheck disable=SC2016
ENV_JS_VARS='${APP_ENV} ${APP_MODE} ${IHSP_WEB_API_URL} ${IHSP_WEB_ID_URL} ${IHSP_WEB_HYDRA_URL} ${IHSP_WEB_SP_URL} ${IHSP_WEB_APP_URL} ${IHSP_WEB_STAFF_URL} ${IHSP_WEB_ADMIN_URL} ${IHSP_WEB_LMS_URL} ${IHSP_WEB_LIBRARY_URL} ${IHSP_WEB_SHARE_URL} ${IHSP_WEB_SHORT_LINKS_URL} ${IHSP_WEB_ROOMS_URL} ${IHSP_WEB_MCP_URL} ${IHSP_BOT_USERNAME} ${OAUTH_CLIENT_ID} ${IHSP_STORAGE_ORIGIN}'
# shellcheck disable=SC2016
NGINX_VARS='${LISTEN_PORT} ${APP_HOST_ID} ${APP_HOST_MY} ${APP_HOST_APP} ${APP_HOST_STAFF} ${APP_HOST_ADMIN} ${APP_HOST_LMS} ${APP_HOST_LIBRARY} ${APP_HOST_SHARE} ${API_HOST} ${MCP_HOST} ${ROOT_HOST} ${HYDRA_UPSTREAM} ${IDENTITY_UPSTREAM} ${API_UPSTREAM} ${BOT_UPSTREAM} ${BACKEND_UPSTREAM} ${CSP_CONNECT_SRC} ${CSP_IMG_SRC} ${IHSP_STORAGE_ORIGIN} ${IHSP_WEB_SP_URL}'

# app_mode APP: "pwa" for an app listed in PWA_APPS that can be installed on its own host, "sp" otherwise
PWA_APPS="${PWA_APPS:-}"
PWA_APPS=$(printf '%s' "$PWA_APPS" | tr ',' ' ')
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

# env.js is rendered with envsubst into JavaScript string literals ("${VAR}"). A value with a double
# quote, a backslash or a control character (a newline) would end the literal: the script would not
# parse (every page broken) or run what follows. Such a value is a configuration mistake and stops the
# container here, where it is seen, instead of at the first page load.
# shellcheck disable=SC2016 # the ${} are stripped, not expanded
for name in $(printf '%s' "$ENV_JS_VARS" | tr -d '${}'); do
  eval "value=\${$name:-}"
  # shellcheck disable=SC2154 # value is set by the eval above
  if [ "$(printf '%s' "$value" | LC_ALL=C tr -d '"\\[:cntrl:]')" != "$value" ]; then
    echo "entrypoint: $name must not contain a double quote, a backslash or a control character" >&2
    exit 1
  fi
done

# render_env SUBDIR APP_MODE CLIENT: env.js of one app into $ENV_DIR/SUBDIR/env.js
render_env() {
  mkdir -p "$ENV_DIR/$1"
  APP_MODE="$2" OAUTH_CLIENT_ID="$3" envsubst "$ENV_JS_VARS" < "$ENV_JS_TEMPLATE" > "$ENV_DIR/$1/env.js"
}

# Render env.js for each app (share loads /ai/env.js: its own directory, see sites/share.conf)
for app in id sp staff admin lms library; do
  render_env "$app" "$(app_mode "$app")" "$app"
done
render_env share/ai sp share

# The installable PWA is the sp build on a second host (sites/app.conf) with its own env.js. It is
# rendered outside the static export (/srv/sp keeps the env.js of the sp host).
render_env app-env pwa app

# render_dir SRC DST: render every *.conf template of SRC into DST
render_dir() {
  mkdir -p "$2"
  for file in "$1"/*.conf; do
    # shellcheck disable=SC2094 # reads a template of $1, writes a new file under $2
    envsubst "$NGINX_VARS" < "$file" > "$2/$(basename "$file")"
  done
}

# Start from a clean slate: a restart of the container re-renders everything
rm -rf "$NGINX_DIR/conf.d" "$NGINX_DIR/snippets"
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
