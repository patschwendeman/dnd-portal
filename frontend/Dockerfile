# Stages:
#   dev   – Vite-Dev-Server mit Hot-Reload (lokale Entwicklung, docker-compose.yml)
#   build – statischer Build nach /app/dist
#   prod  – nginx liefert den Build aus (compose.prod.yaml im Root)
# Node-Version mit .nvmrc synchron halten (Stages dev und build).

FROM node:18-slim AS dev

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

CMD [ "npm", "run", "dev-exposed" ]


FROM node:18-slim AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Base URL of the API, inlined into the bundle by Vite; a different URL requires a rebuild.
ARG VITE_API_URL=http://localhost:8000/
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build


FROM nginx:1.27.5-alpine AS prod

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
