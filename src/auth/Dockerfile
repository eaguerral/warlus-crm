
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY index.js ./

ENV AUTH_PORT=8081

EXPOSE 8081

CMD ["npm", "start"]
