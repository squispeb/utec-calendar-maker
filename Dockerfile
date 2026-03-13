FROM oven/bun:1 AS web-builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM python:3.12-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8787
ENV MAX_UPLOAD_MB=20

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && pip install --no-cache-dir 'markitdown[pdf]'

COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY server ./server
COPY src ./src
COPY --from=web-builder /app/dist ./dist

EXPOSE 8787

CMD ["bun", "run", "start"]
