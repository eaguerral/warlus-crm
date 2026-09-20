
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY index.js ./

ENV PAGOS_PORT=8084

EXPOSE 8084

CMD ["npm", "start"]
