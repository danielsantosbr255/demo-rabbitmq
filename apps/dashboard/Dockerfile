FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --ignore-scripts

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_API_GATEWAY_URL
ARG VITE_INSPECTOR_URL
ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL
ENV VITE_INSPECTOR_URL=$VITE_INSPECTOR_URL

RUN pnpm build

FROM nginxinc/nginx-unprivileged:alpine AS prod
ENV NGINX_ENVSUBST_FILTER="GATEWAY_API_URL RABBITMQ_API_URL"
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

