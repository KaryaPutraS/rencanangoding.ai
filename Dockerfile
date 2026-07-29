FROM node:20-alpine AS base

FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm turbo
COPY . .
RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app .

EXPOSE 3000
CMD ["pnpm", "--filter", "@rencanangoding/web", "start"]
