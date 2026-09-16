# syntax=docker/dockerfile:1
# TanStack Start SSR + nginx reverse proxy for /api.

FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

FROM base AS builder
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && test -f dist/server/server.js
# Build once, then keep only production dependencies for the runtime image.
RUN pnpm prune --prod

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV SSR_HOST=127.0.0.1
ENV SSR_PORT=4173

RUN apk add --no-cache nginx wget \
  && mkdir -p /run/nginx /var/lib/nginx /var/log/nginx \
  && chown -R node:node /run/nginx /var/lib/nginx /var/log/nginx /app

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --chown=node:node production-server.mjs ./production-server.mjs
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod 0755 /docker-entrypoint.sh

USER node
EXPOSE 8080
CMD ["/docker-entrypoint.sh"]
