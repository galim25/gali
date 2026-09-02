# Single Dockerfile, multiple targets (`web` / `worker`) — shares the deps/build
# stages so the pnpm workspace (packages/db, packages/shared consumed as raw TS
# source, not pre-built — see CLAUDE.md "Stack וארכיטקטורה") is only installed
# once. Build from the repo root: `docker build --target web .` /
# `docker build --target worker .` (docker-compose.yml does this via `target:`).
#
# Debian slim (not Alpine): Prisma's query-engine binary needs glibc + OpenSSL 3,
# both present out of the box on bookworm-slim — Alpine needs extra
# openssl/libc6-compat wrangling that isn't worth it for this app's traffic.

FROM node:22-bookworm-slim AS base
RUN corepack enable
WORKDIR /repo

# --- deps: install the whole workspace's node_modules from the lockfile ---
# pnpm's frozen-lockfile install needs every workspace package.json present
# (it validates the lockfile against the full workspace), so all four are
# copied even though a given final image only runs one of them.
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

# --- build: full source + prisma client + next build (web only needs the build
# step, but generating it here once keeps this stage shared/cacheable) ---
FROM deps AS build
COPY . .
RUN pnpm db:generate
RUN pnpm --filter @barberbook/web build

# --- web: next start ---
FROM build AS web
ENV NODE_ENV=production
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["pnpm", "exec", "next", "start", "-p", "3000", "-H", "0.0.0.0"]

# --- worker: node-cron loop via tsx (apps/worker's own `pnpm build`/tsc doesn't
# work yet — packages/db and packages/shared are consumed as TS source with no
# build step of their own, see CLAUDE.md — tsx is the documented way to run it
# in production too, just without --watch) ---
FROM build AS worker
ENV NODE_ENV=production
WORKDIR /repo/apps/worker
CMD ["pnpm", "exec", "tsx", "src/index.ts"]
