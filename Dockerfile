# Simple Dockerfile - pure in-memory storage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY simple-server.mjs ./

EXPOSE 10000

CMD ["node", "simple-server.mjs"]
