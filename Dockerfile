FROM node:lts-buster-slim as base

WORKDIR /usr/server


COPY ./ .
RUN corepack enable pnpm \
    pnpm i


ENV NODE_ENV=production
RUN pnpm build

CMD ["pnpm", "start"]
