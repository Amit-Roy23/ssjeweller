# ==============================================================================
# S.S JEWELLERY ERP — Production Multi-Stage Dockerfile
# Optimized for minimal image footprint, high performance & unprivileged user
# ==============================================================================

# 1. Base dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app

# Install native dependencies required by Alpine
RUN apk add --no-cache libc6-compat openssl

# Install dependencies based on package-lock.json
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# 2. Builder stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# 3. Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install openssl for Prisma runtime
RUN apk add --no-cache openssl curl

# Create unprivileged system user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets and standalone server bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

# Health check calling /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
