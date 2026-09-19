# cSpell: ignore pango,pixman,noto,fontconfig

#!/usr/bin/env -S docker image build . --tag soberbot --file

FROM oven/bun:alpine AS build

# hadolint ignore=DL3016,DL3018
RUN apk add --no-cache \
  # * canvas build
  build-base \
  g++ \
  cairo-dev \
  pango-dev \
  pixman-dev \
  python3 \
  # * app runtime
  tzdata \
  # * util
  sqlite \
  # * canvas runtime
  cairo \
  pango \
  pixman \
  # * canvas emoji
  font-noto-emoji \
  fontconfig \
  && fc-cache -f -v \
  # * canvas node-gyp
  && ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

LABEL org.opencontainers.image.authors="Chris Post <admin@postfmly.com>" \
  org.opencontainers.image.description="SoberBot for Discord" \
  org.opencontainers.image.licenses="GPL-3.0-only" \
  org.opencontainers.image.title="SoberBot" \
  org.opencontainers.image.url="https://github.com/chump29/soberbot"

ENV BUN_INSTALL_CACHE_DIR=/.bun-cache
ENV TZ=Etc/GMT

COPY package.json bun.lock ./
COPY patches/ ./patches/

RUN --mount=type=cache,target=/.bun-cache \
  bun install --frozen-lockfile --production

COPY . .

HEALTHCHECK --interval=60s CMD source healthcheck.sh

EXPOSE 8008

ENTRYPOINT ["bun", "run", "prod"]
