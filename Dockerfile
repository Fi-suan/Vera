FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG PRISMA_SCHEMA=prisma/schema.prisma
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=${PRISMA_SCHEMA}
EXPOSE 4000
CMD ["npm", "start"]
