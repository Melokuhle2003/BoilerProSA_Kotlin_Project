FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY sql ./sql
RUN npm run build
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY public ./public
COPY admin ./admin
COPY sql ./sql
EXPOSE 8443
CMD ["node","dist/server.js"]
