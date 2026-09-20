
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY index.js ./

ENV PEDIDOS_PORT=8083

EXPOSE 8083

CMD ["npm", "start"]
