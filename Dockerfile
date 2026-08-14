# --- Base Node.js Image ---
FROM node:22-alpine AS base
WORKDIR /app

# --- Dependencies Layer ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- Build Layer ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# --- Production Runner Layer ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules and built artifacts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prod-server.js ./prod-server.js
COPY --from=builder /app/src ./src
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/legacy-data ./legacy-data

# Use non-root user
USER node

EXPOSE 3000

CMD ["npm", "run", "start"]
