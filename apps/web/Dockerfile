FROM node:20.11-slim AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

ENV PNPM_STORE_PATH=/app/.pnpm-store
RUN pnpm config set store-dir /app/.pnpm-store

COPY package.json pnpm-workspace.yaml tsconfig.base.json turbo.json ./
COPY shared ./shared
COPY apps ./apps

ARG VITE_GRAPHQL_ENDPOINT
ARG GRAPHQL_ENDPOINT
ENV VITE_GRAPHQL_ENDPOINT=$VITE_GRAPHQL_ENDPOINT
ENV GRAPHQL_ENDPOINT=$GRAPHQL_ENDPOINT

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @app/web build
RUN test -f /app/apps/web/.output/server/index.mjs || test -d /app/apps/web/dist
RUN pnpm prune --prod

FROM node:20.11-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ARG GRAPHQL_ENDPOINT
ENV GRAPHQL_ENDPOINT=$GRAPHQL_ENDPOINT
ENV PNPM_STORE_PATH=/app/.pnpm-store

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/.pnpm-store /app/.pnpm-store
COPY --from=builder /app/apps/web /app/apps/web

EXPOSE 4100

CMD ["node", "/app/apps/web/docker-start.mjs"]
