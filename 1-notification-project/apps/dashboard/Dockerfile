FROM node:24-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json ./
RUN pnpm install --ignore-scripts

COPY . .

EXPOSE 5173
CMD ["pnpm", "run", "dev", "--host"]
