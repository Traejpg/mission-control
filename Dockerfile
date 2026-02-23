# Dockerfile for Mission Control Backend (Render Cloud)
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy standalone backend files (no OpenClaw dependency)
COPY render-gateway.cjs ./
COPY render-watcher.cjs ./

# Create memory directory
RUN mkdir -p /app/data/memory

# Expose ports (Render uses these internally)
EXPOSE 10000 10001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:10000/health || exit 1

# Start both standalone services
CMD ["sh", "-c", "node render-gateway.cjs & node render-watcher.cjs & wait"]
