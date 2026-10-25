# Explicit Node comparison image; production defaults to services/taptap/csharp/Dockerfile.
FROM node:24.22.1-alpine AS build-base
WORKDIR /app
RUN apk add --no-cache bash python3 make g++

FROM build-base AS builder
COPY package.json package-lock.json tsconfig.base.json ./
COPY services/taptap ./services/taptap
COPY scripts ./scripts
RUN npm ci && ./scripts/build.sh --no-format

FROM builder AS development
ENV NODE_ENV=development
CMD ["node", "--import", "tsx", "services/taptap/node/apps/server/src/bin/server.ts"]

FROM build-base AS runtime-deps
COPY package.json package-lock.json ./
COPY services/taptap/package.json ./services/taptap/package.json
COPY services/taptap/node ./services/taptap/node
RUN npm ci --omit=dev

FROM node:24.22.1-alpine AS production
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=runtime-deps /app/node_modules ./node_modules
COPY --from=builder /app/services/taptap/node/apps/server/dist ./services/taptap/node/apps/server/dist
COPY --from=builder /app/services/taptap/node/apps/server/package.json ./services/taptap/node/apps/server/package.json
COPY --from=builder /app/services/taptap/node/packages/taptap-db/dist ./services/taptap/node/packages/taptap-db/dist
COPY --from=builder /app/services/taptap/node/packages/taptap-db/package.json ./services/taptap/node/packages/taptap-db/package.json
COPY --from=builder /app/services/taptap/node/packages/taptap-logger/dist ./services/taptap/node/packages/taptap-logger/dist
COPY --from=builder /app/services/taptap/node/packages/taptap-logger/package.json ./services/taptap/node/packages/taptap-logger/package.json
ENV NODE_ENV=production
STOPSIGNAL SIGTERM
ENTRYPOINT ["node", "services/taptap/node/apps/server/dist/bin/server.js"]
