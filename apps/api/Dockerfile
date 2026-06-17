FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile --filter api...

COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api

RUN npx prisma generate

RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/index.js"]
