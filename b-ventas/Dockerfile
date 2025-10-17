# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Instala dependencias
COPY package*.json ./
RUN npm ci

# Copia el código y compila
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app

# No correr como root
RUN addgroup -S app && adduser -S app -G app
USER app

# Copia sólo lo necesario para producción
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Puerto de Nest (interno)
EXPOSE 3000

# HEALTHCHECK opcional (lo añadimos por compose)
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
