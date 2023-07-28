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
FROM deps AS builder

WORKDIR /app
RUN yarn --frozen-lockfile --production=false 
COPY . .
ENV NEXT_PUBLIC_FK_MEDIA https://beta.frikanalen.no/media
ENV NEXT_PUBLIC_FK_GRAPHQL https://beta.frikanalen.no/graphql
ENV NEXT_PUBLIC_FK_API https://beta.frikanalen.no/api/v2
ENV NEXT_PUBLIC_FK_UPLOAD https://beta.frikanalen.no/api/v2/media/upload
ENV NEXT_PUBLIC_FK_MEDIAPROC https://beta.frikanalen.no/api/v2/media
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
