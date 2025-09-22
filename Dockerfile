# ---- Build Stage ----
FROM node:20-alpine AS builder

# Set workdir
WORKDIR /app

# Install deps
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm install

# Copy source
COPY . .

# Build NestJS
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

# Hanya copy hasil build + node_modules prod
COPY package*.json ./
RUN npm install --only=production

# Copy dari builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Prisma generate (biar client bisa jalan)
RUN npx prisma generate

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main.js"]
