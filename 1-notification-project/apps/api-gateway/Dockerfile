FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api-gateway/package.json apps/api-gateway/
RUN pnpm install --frozen-lockfile --filter api-gateway

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api-gateway/node_modules ./apps/api-gateway/node_modules
COPY tsconfig.base.json ./
COPY apps/api-gateway/ ./apps/api-gateway/
RUN cd apps/api-gateway && pnpm run build

FROM node:24-alpine AS runner
RUN addgroup -g 1001 -S appuser && adduser -S appuser -u 1001 -G appuser
WORKDIR /app
COPY --from=deps --chown=appuser:appuser /app/apps/api-gateway/node_modules ./node_modules
COPY --from=build --chown=appuser:appuser /app/apps/api-gateway/dist ./dist
USER appuser
EXPOSE 3000
CMD ["node", "dist/main.js"]
