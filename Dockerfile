# Muse Iris — production image.
# Multi-stage build: install deps, build client SPA, package a slim runtime that
# serves /api/* via Express and the built SPA from /.

# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app

# Root + workspace package files first for cache friendliness.
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install everything (incl. devDeps — needed for the Vite build step).
RUN npm install --no-audit --no-fund \
 && npm --prefix server install --no-audit --no-fund \
 && npm --prefix client install --no-audit --no-fund

# ---------- build ----------
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm --prefix client run build

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Server prod deps only.
COPY server/package.json ./server/
COPY server/package-lock.json* ./server/
RUN npm --prefix server install --omit=dev --no-audit --no-fund

# Server source + migrations
COPY server/src ./server/src
COPY server/db ./server/db

# Built SPA (served as static)
COPY --from=build /app/client/dist ./client/dist

EXPOSE 3001
CMD ["node", "server/src/index.js"]
