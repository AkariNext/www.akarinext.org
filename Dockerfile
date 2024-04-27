FROM node:lts-buster-slim as base

WORKDIR /usr/server


COPY ./ .
RUN corepack enable
RUN pnpm i


FROM base AS build
ENV NODE_ENV=production
RUN pnpm build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
CMD ["pnpm", "start"]
