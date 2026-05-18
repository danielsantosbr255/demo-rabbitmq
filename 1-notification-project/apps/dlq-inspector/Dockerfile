FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/dlq-inspector/package.json apps/dlq-inspector/
RUN pnpm install --frozen-lockfile --filter dlq-inspector

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/dlq-inspector/node_modules ./apps/dlq-inspector/node_modules
COPY tsconfig.base.json ./
COPY apps/dlq-inspector/ ./apps/dlq-inspector/
RUN cd apps/dlq-inspector && pnpm run build

FROM node:24-alpine AS runner
RUN addgroup -g 1001 -S appuser && adduser -S appuser -u 1001 -G appuser
WORKDIR /app
COPY --from=deps --chown=appuser:appuser /app/apps/dlq-inspector/node_modules ./node_modules
COPY --from=build --chown=appuser:appuser /app/apps/dlq-inspector/dist ./dist
USER appuser
CMD ["node", "dist/main.js"]
