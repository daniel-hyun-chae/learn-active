FROM node:20.11-slim AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

ENV PNPM_STORE_PATH=/app/.pnpm-store
RUN pnpm config set store-dir /app/.pnpm-store

COPY package.json pnpm-workspace.yaml tsconfig.base.json turbo.json ./
COPY shared ./shared
COPY apps ./apps

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @app/api build
RUN test -f /app/apps/api/dist/index.js

FROM node:20.11-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV PNPM_STORE_PATH=/app/.pnpm-store

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/.pnpm-store /app/.pnpm-store
COPY --from=builder /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=builder /app/apps/api/dist /app/apps/api/dist
COPY --from=builder /app/apps/api/package.json /app/apps/api/package.json

EXPOSE 4000

CMD ["node", "/app/apps/api/dist/index.js"]
