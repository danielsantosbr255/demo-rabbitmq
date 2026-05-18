FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/push-worker/package.json apps/push-worker/
RUN pnpm install --frozen-lockfile --filter push-worker

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/push-worker/node_modules ./apps/push-worker/node_modules
COPY tsconfig.base.json ./
COPY apps/push-worker/ ./apps/push-worker/
RUN cd apps/push-worker && pnpm run build

FROM node:24-alpine AS runner
RUN addgroup -g 1001 -S appuser && adduser -S appuser -u 1001 -G appuser
WORKDIR /app
COPY --from=deps --chown=appuser:appuser /app/apps/push-worker/node_modules ./node_modules
COPY --from=build --chown=appuser:appuser /app/apps/push-worker/dist ./dist
USER appuser
CMD ["node", "dist/main.js"]
