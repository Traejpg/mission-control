# Force CommonJS - explicit .cjs file
FROM node:20-alpine

WORKDIR /app

# Install deps only
COPY package*.json ./
RUN npm install --production

# Copy server with .cjs extension (forces CommonJS regardless of package.json)
COPY simple-server.cjs ./server.cjs

EXPOSE 10000

CMD ["node", "server.cjs"]
