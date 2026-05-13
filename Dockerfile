# Muse Iris — production image.
# Multi-stage build: install deps, build client SPA, package a slim runtime that
# serves /api/* via Express and the built SPA from /.

# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app
# Force devDependencies in spite of any NODE_ENV=production injected by the
# build host (e.g. Coolify "Available at Buildtime") — Vite + the build
# toolchain live in devDeps and the build stage needs them.
ENV NODE_ENV=development

# Root + workspace package files first for cache friendliness.
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install everything (incl. devDeps — needed for the Vite build step).
# --include=dev is belt-and-suspenders alongside ENV NODE_ENV=development.
RUN npm install --no-audit --no-fund --include=dev \
 && npm --prefix server install --no-audit --no-fund --include=dev \
 && npm --prefix client install --no-audit --no-fund --include=dev

# ---------- build ----------
FROM deps AS build
WORKDIR /app
ENV NODE_ENV=development
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

# BusyBox wget ships in node:22-alpine; --spider just probes without fetching the body.
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget --quiet --spider http://localhost:3001/api/health || exit 1

CMD ["node", "server/src/index.js"]
