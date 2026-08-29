#!/usr/bin/env -S docker image build . --tag soberbot --file

FROM oven/bun:alpine AS build

WORKDIR /app

COPY . .

ENV BUN_INSTALL_CACHE_DIR=/.bun-cache

RUN --mount=type=cache,target=/.bun-cache \
  bun install --frozen-lockfile --ignore-scripts --production

# -=-

FROM oven/bun:alpine

WORKDIR /app

LABEL org.opencontainers.image.authors="Chris Post <admin@postfmly.com>" \
  org.opencontainers.image.description="SoberBot for Discord" \
  org.opencontainers.image.licenses="GPL-3.0-only" \
  org.opencontainers.image.title="SoberBot" \
  org.opencontainers.image.url="https://github.com/chump29/soberbot"

# hadolint ignore=DL3018
RUN apk add --no-cache tzdata sqlite

COPY --from=build /app /app/

ENV TZ=Etc/GMT

HEALTHCHECK --interval=60s CMD source healthcheck.sh

EXPOSE 8008

ENTRYPOINT ["bun", "run", "prod"]
