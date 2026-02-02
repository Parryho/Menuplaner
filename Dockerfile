# --- Build stage ---
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN mkdir -p data
RUN npm run build

# --- Production stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create data directory (will be replaced by Fly volume mount)
RUN mkdir -p /data

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Symlink data dir to Fly volume mount
RUN ln -s /data /app/data

EXPOSE 3000

CMD ["node", "server.js"]
