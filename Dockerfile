#!/usr/bin/env -S docker image build . --tag soberbot --file

FROM oven/bun:alpine AS build

# hadolint ignore=DL3016,DL3018
RUN apk add --no-cache \
  build-base \
  g++ \
  cairo-dev \
  pango-dev \
  pixman-dev \
  python3 \
  nodejs \
  npm \
  && npm install node-gyp

WORKDIR /app

ENV BUN_INSTALL_CACHE_DIR=/.bun-cache

COPY package.json bun.lock ./
COPY patches/ ./patches/

RUN --mount=type=cache,target=/.bun-cache \
  bun install --frozen-lockfile --production

# -=-

FROM oven/bun:alpine

# hadolint ignore=DL3018
RUN apk add --no-cache \
  tzdata \
  sqlite \
  cairo \
  pango \
  pixman \
  font-noto-emoji \
  fontconfig \
  && fc-cache -f -v

WORKDIR /app

LABEL org.opencontainers.image.authors="Chris Post <admin@postfmly.com>" \
  org.opencontainers.image.description="SoberBot for Discord" \
  org.opencontainers.image.licenses="GPL-3.0-only" \
  org.opencontainers.image.title="SoberBot" \
  org.opencontainers.image.url="https://github.com/chump29/soberbot"

ENV TZ=Etc/GMT

COPY --from=build /app/node_modules ./node_modules
COPY package.json ./

COPY . .

HEALTHCHECK --interval=60s CMD source healthcheck.sh

EXPOSE 8008

ENTRYPOINT ["bun", "run", "prod"]
