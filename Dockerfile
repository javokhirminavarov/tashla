FROM node:18-alpine AS webapp-build
WORKDIR /app/webapp
COPY webapp/package.json webapp/package-lock.json ./
RUN npm ci
COPY webapp/ .
RUN npm run build

FROM node:18-alpine AS api-build
WORKDIR /app/api
COPY api/package.json api/package-lock.json ./
RUN npm ci
COPY api/ .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=api-build /app/api/dist ./dist
COPY --from=webapp-build /app/webapp/dist ./public
ENV WEBAPP_DIR=/app/public
EXPOSE 3000
CMD ["node", "dist/index.js"]
