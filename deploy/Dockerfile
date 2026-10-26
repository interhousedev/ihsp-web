# Build stage: only the static exports leave it (see the nginx stage). Nothing else of the builder
# (node_modules, sources, bun itself) reaches the image.
FROM oven/bun:1.4.3-alpine AS builder

WORKDIR /app

# Copy lockfile and package files
COPY bun.lock bunfig.toml ./
COPY package.json ./

# Copy app and package sources
COPY apps ./apps
COPY packages ./packages

# Install dependencies
RUN bun install --frozen-lockfile

# Build-time version of the installable app (the sp build served on the app host). The PWA compares
# it with GET /v1/app/version (latest / min_supported) and forces an update when it is too old.
# Bump it with `--build-arg NEXT_PUBLIC_APP_VERSION=1.2.3`; it is inlined into the bundle by next build.
ARG NEXT_PUBLIC_APP_VERSION=1.0.0
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}

# Build-time DSN of error tracking (Bugsink, Sentry protocol). Empty (the default) means no error tracking;
# the DSN is public, it only lets the browser send events. Pass `--build-arg NEXT_PUBLIC_BUGSINK_DSN=...`.
ARG NEXT_PUBLIC_BUGSINK_DSN=
ENV NEXT_PUBLIC_BUGSINK_DSN=${NEXT_PUBLIC_BUGSINK_DSN}

# Build all apps
RUN bun run build

# CSP hashing: adds the per-page <meta> script-src policy to every exported HTML file
COPY deploy/csp-hash.ts ./deploy/csp-hash.ts
RUN bun deploy/csp-hash.ts

# nginx stage: the unprivileged nginx image (runs as uid 101, listens on 8080). Identical to the nginx
# stage of deploy/Dockerfile.prebuilt, which deploy/docker.test.ts checks.
FROM nginxinc/nginx-unprivileged:1.31.6-alpine

# Build steps run as root; the container runs as the nginx user (see USER below) and everything it
# ships stays root-owned and read-only for it
USER root

# envsubst (from gettext) is part of the base image; fail the build here, not at container start, if not
RUN command -v envsubst >/dev/null

# nginx config: nginx.conf as is; sites and snippets are templates that entrypoint.sh renders
# with envsubst into /tmp/ihsp/nginx at every start
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/sites/ /app/templates/sites/
COPY deploy/snippets/ /app/templates/snippets/
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy built apps
COPY --from=builder /app/apps/id/out /srv/id
COPY --from=builder /app/apps/sp/out /srv/sp
COPY --from=builder /app/apps/staff/out /srv/staff
COPY --from=builder /app/apps/admin/out /srv/admin
COPY --from=builder /app/apps/lms/out /srv/lms
COPY --from=builder /app/apps/library/out /srv/library
COPY --from=builder /app/apps/landing/out /srv/landing
COPY --from=builder /app/apps/share/out /srv/share/ai

# Copy env.js template and entrypoint
COPY deploy/env.js.template /app/env.js.template
COPY deploy/entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

# LISTEN_PORT (default 8080) is the only port; TLS is terminated by the edge nginx in front of this image
EXPOSE 8080

# busybox wget is in the base image; curl is not installed
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${LISTEN_PORT:-8080}/health"

STOPSIGNAL SIGQUIT
USER 101

ENTRYPOINT ["/app/entrypoint.sh"]
