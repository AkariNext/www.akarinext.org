FROM node:lts-buster-slim as base

WORKDIR /usr/server

COPY ./package.json ./
RUN npm install

COPY ./ .

ENV NODE_ENV=production
RUN npm run build

CMD ["npm", "run", "start"]

