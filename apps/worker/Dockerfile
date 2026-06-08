FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/
RUN npm install --ignore-scripts
# Install playwright chromium
RUN npx playwright install chromium --with-deps 2>/dev/null || true
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/worker ./apps/worker
RUN npm run build -w packages/shared && npm run build -w apps/worker

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/
RUN npm install --omit=dev --ignore-scripts
RUN npx playwright install chromium --with-deps 2>/dev/null || true
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
CMD ["node", "apps/worker/dist/index.js"]
