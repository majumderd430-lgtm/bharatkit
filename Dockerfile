# ============================================================
# BharatKit - Multi-stage Docker Build
# ============================================================

# Stage 1: Build React Dashboard
FROM node:20-alpine AS dashboard-builder

WORKDIR /app/dashboard

COPY dashboard/package*.json ./
RUN npm ci

COPY dashboard/ ./
RUN npm run build

# Stage 2: Production API Server
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S bharatkit && \
    adduser -S bharatkit -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY src/ ./src/
COPY --from=dashboard-builder /app/dashboard/dist ./dashboard/dist

# Create logs directory
RUN mkdir -p logs && chown -R bharatkit:bharatkit /app

# Generate Prisma client
COPY src/models/schema.prisma ./prisma/schema.prisma
RUN npx prisma generate

# Switch to non-root user
USER bharatkit

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
