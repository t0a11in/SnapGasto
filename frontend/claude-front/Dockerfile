# Front Angular (SSR con Express). Compila en una etapa y ejecuta solo lo necesario.
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build -- --configuration production

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000

# Dependencias de ejecución (Express, @angular/ssr…) sin las de desarrollo.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=builder /app/dist/claude-front ./dist/claude-front
USER node
EXPOSE 4000
CMD ["node", "dist/claude-front/server/server.mjs"]
