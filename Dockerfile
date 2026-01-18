# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app
COPY game/package.json game/package-lock.json ./
RUN npm ci
COPY game/ ./
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
