FROM node:24.22.1-alpine AS dependencies
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --workspaces=false

FROM node:24.22.1-alpine AS migrations
WORKDIR /app
COPY package.json package-lock.json ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY services/taptap/knexfile.taptap.mjs ./services/taptap/knexfile.taptap.mjs
COPY services/taptap/database/taptap/sqlite/migrations ./services/taptap/database/taptap/sqlite/migrations
RUN mkdir -p /app/data
ENV NODE_ENV=production
CMD ["./node_modules/.bin/knex", "migrate:latest", "--knexfile", "services/taptap/knexfile.taptap.mjs", "--env", "production"]
