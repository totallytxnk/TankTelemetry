FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY apps/intake/package.json ./package.json
RUN npm install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY apps/intake/package.json ./package.json
COPY apps/intake/tsconfig.json ./tsconfig.json
COPY apps/intake/prisma ./prisma
COPY apps/intake/src ./src
RUN npx prisma generate
RUN npx tsc

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 intake
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
USER intake
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
