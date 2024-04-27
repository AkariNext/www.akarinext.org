FROM node:lts-buster-slim as base

WORKDIR /usr/server


COPY ./ .
RUN npm ci

ENV NODE_ENV=production
RUN npm run build

CMD ["npm", "run", "start"]

