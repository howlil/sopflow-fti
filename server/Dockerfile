# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

FROM base AS builder
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
# Prisma generate does not require a live database. The URL is build-only.
RUN DATABASE_URL=mysql://prisma_generate:prisma_generate@127.0.0.1:3306/prisma_generate pnpm prisma generate
RUN pnpm build && test -f dist/src/main.js && test -f dist/src/database/migration/prepare-existing-baseline.js
# Keep one dependency install in the image build path, then trim dev-only packages.
RUN pnpm prune --prod

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=512

RUN apk add --no-cache wget \
  && mkdir -p /app/storage/sop-pdf \
  && chown -R node:node /app

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
# Custom Prisma output contains runtime JS/WASM required by Prisma 7.
COPY --from=builder --chown=node:node /app/src/generated/prisma ./dist/src/generated/prisma
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY docker-bootstrap.sh /usr/local/bin/sopflow-db-bootstrap.sh
RUN chmod 0755 /usr/local/bin/sopflow-db-bootstrap.sh

USER node
EXPOSE 3001
CMD ["node", "dist/src/main.js"]
