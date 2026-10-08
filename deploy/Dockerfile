# Build stage
FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

# Copy lockfile and package files
COPY bun.lock bunfig.toml ./
COPY package.json ./

# Copy app and package sources
COPY apps ./apps
COPY packages ./packages

# Install dependencies
RUN bun install --frozen-lockfile

# Build all apps
RUN bun run build

# CSP hashing: adds the per-page <meta> script-src policy to every exported HTML file
COPY deploy/csp-hash.ts ./deploy/csp-hash.ts
RUN bun deploy/csp-hash.ts

# nginx stage
FROM nginx:1.27-alpine

# Install curl for health checks
RUN apk add --no-cache curl bash gettext

# nginx config: nginx.conf as is; sites and snippets are templates that entrypoint.sh renders
# with envsubst into /etc/nginx/conf.d and /etc/nginx/snippets at every start
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
COPY --from=builder /app/apps/share/out /srv/share/ai

# Copy env.js template and entrypoint
COPY deploy/env.js.template /app/env.js.template
COPY deploy/entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

# LISTEN_PORT (default 80) is the only port; TLS is terminated by the edge nginx in front of this image
EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD curl -fsS "http://127.0.0.1:${LISTEN_PORT:-80}/health" || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
