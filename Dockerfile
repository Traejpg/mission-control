# Simple Dockerfile - works with CommonJS
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY simple-server.js ./

EXPOSE 10000

CMD ["node", "simple-server.js"]
