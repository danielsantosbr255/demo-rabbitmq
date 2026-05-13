FROM node:24.15.0-alpine3.22 AS base
WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN corepack enable

# -------------------------------------- #

FROM base AS dev
RUN pnpm install
COPY . .

ENV PORT=8080
ENV NODE_ENV=development

EXPOSE ${PORT}
CMD [ "pnpm", "dev" ]

# -------------------------------------- #

FROM dev AS builder

RUN pnpm build && pnpm prune --prod

# -------------------------------------- #

FROM gcr.io/distroless/nodejs24-debian13 AS prod
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE ${PORT}

CMD [ "./dist/main.js" ]
