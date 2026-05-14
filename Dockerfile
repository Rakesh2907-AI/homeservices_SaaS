# Multi-stage build — one Dockerfile, one image per service via SERVICE arg.
# Usage:  docker build --build-arg SERVICE=tenant-service -t hs/tenant-service .
ARG NODE_VERSION=20-alpine

# ===== Stage 1: dependencies =====
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# Copy workspace manifests for cached install.
COPY package*.json ./
COPY shared/package.json ./shared/
COPY services/api-gateway/package.json ./services/api-gateway/
COPY services/tenant-service/package.json ./services/tenant-service/
COPY services/auth-service/package.json ./services/auth-service/
COPY services/booking-service/package.json ./services/booking-service/
COPY services/pricing-service/package.json* ./services/pricing-service/
COPY services/notification-service/package.json* ./services/notification-service/

RUN npm install --omit=dev --workspaces --include-workspace-root

# ===== Stage 2: runtime =====
FROM node:${NODE_VERSION} AS runtime
ARG SERVICE
ENV NODE_ENV=production
ENV SERVICE_NAME=${SERVICE}
WORKDIR /app

# Non-root user
RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY shared ./shared
COPY services/${SERVICE} ./services/${SERVICE}
COPY package.json ./

USER app

# Health probe baked into image (used by K8s liveness)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O- http://localhost:${PORT:-3000}/health || exit 1

WORKDIR /app/services/${SERVICE}
CMD ["node", "src/server.js"]
