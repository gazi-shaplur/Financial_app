FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/api/package*.json ./apps/api/
RUN npm ci --workspace apps/web --include-workspace-root
COPY apps/web ./apps/web
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/apps/web/public ./public
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
CMD ["node","apps/web/server.js"]
