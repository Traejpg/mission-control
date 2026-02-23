# Dockerfile for Mission Control Backend Services
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY unified-gateway.cjs ./
COPY file-watcher-backend.cjs ./
COPY netlify.toml ./

# Create memory directory
RUN mkdir -p /app/data/memory

# Expose ports
EXPOSE 18789 18791

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:18789/health || exit 1

# Start both services
CMD ["sh", "-c", "node unified-gateway.cjs & node file-watcher-backend.cjs & wait"]
