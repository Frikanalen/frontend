# Base image for dependency installation
FROM node:22-alpine AS deps
WORKDIR /app

# Ensure native deps (optional, for e.g. Prisma, sharp, etc.)
RUN apk add --no-cache libc6-compat

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Build app
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_DJANGO_URL

ENV NEXT_PUBLIC_DJANGO_URL=$NEXT_PUBLIC_DJANGO_URL

RUN yarn build

# Final runtime image
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only required files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]

