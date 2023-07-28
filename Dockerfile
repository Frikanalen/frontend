################################################################################
# Run-time dependencies
################################################################################
FROM node:18-alpine AS deps

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile --production=true

################################################################################
# Build-time dependencies
################################################################################
FROM deps AS build-deps

WORKDIR /app
RUN yarn --frozen-lockfile --production=false 

################################################################################
# Builder
################################################################################
FROM node:18-alpine AS builder

WORKDIR /app
COPY . .
COPY --from=build-deps /app/node_modules ./node_modules

RUN yarn build

################################################################################
# Runner
################################################################################
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --chown=node --from=deps /app/node_modules ./node_modules
COPY package.json yarn.lock ./

USER node

CMD yarn start

EXPOSE 3000
