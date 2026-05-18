FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/sms-worker/package.json apps/sms-worker/
RUN pnpm install --frozen-lockfile --filter sms-worker

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/sms-worker/node_modules ./apps/sms-worker/node_modules
COPY tsconfig.base.json ./
COPY apps/sms-worker/ ./apps/sms-worker/
RUN cd apps/sms-worker && pnpm run build

FROM node:24-alpine AS runner
RUN addgroup -g 1001 -S appuser && adduser -S appuser -u 1001 -G appuser
WORKDIR /app
COPY --from=deps --chown=appuser:appuser /app/apps/sms-worker/node_modules ./node_modules
COPY --from=build --chown=appuser:appuser /app/apps/sms-worker/dist ./dist
USER appuser
CMD ["node", "dist/main.js"]
