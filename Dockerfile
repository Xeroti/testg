# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

FROM base AS web-deps
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci

FROM web-deps AS web-build
COPY web/ ./
RUN npm run build

FROM node:20-alpine AS web
WORKDIR /app
ENV NODE_ENV=production
COPY web/package.json web/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=web-build /app/web/.next ./.next
COPY --from=web-build /app/web/public ./public
COPY --from=web-build /app/web/next.config.js ./next.config.js
EXPOSE 3000
CMD ["npm", "start"]

FROM base AS game-deps
WORKDIR /app/game
COPY game/package.json game/package-lock.json ./
RUN npm ci

FROM game-deps AS game-build
COPY game/ ./
RUN npm run build

FROM nginx:1.27-alpine AS game
COPY --from=game-build /app/game/dist /usr/share/nginx/html
EXPOSE 80

FROM node:20-alpine AS combined
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN apk add --no-cache nginx
COPY web/package.json web/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=web-build /app/web/.next ./.next
COPY --from=web-build /app/web/public ./public
COPY --from=web-build /app/web/next.config.js ./next.config.js
COPY --from=game-build /app/game/dist /usr/share/nginx/html/game
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh
EXPOSE 80
CMD ["/usr/local/bin/start.sh"]
