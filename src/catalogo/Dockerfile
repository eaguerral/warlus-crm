
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY index.js ./

ENV CATALOGO_PORT=8082

EXPOSE 8082

CMD ["npm", "start"]
