# Force CommonJS with .cjs extension
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY simple-server.cjs ./

EXPOSE 10000

CMD ["node", "simple-server.cjs"]
