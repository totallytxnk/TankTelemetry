FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY apps/dashboard/package.json ./package.json
RUN npm install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY apps/dashboard/package.json ./package.json
COPY apps/dashboard/tsconfig.json ./tsconfig.json
COPY apps/dashboard/next.config.ts ./next.config.ts
COPY apps/dashboard/postcss.config.mjs ./postcss.config.mjs
COPY apps/dashboard/tailwind.config.ts ./tailwind.config.ts
COPY apps/dashboard/next-env.d.ts ./next-env.d.ts
COPY apps/dashboard/src ./src
COPY apps/dashboard/public ./public
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
