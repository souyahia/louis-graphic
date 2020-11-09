FROM node:15.1.0-alpine3.10

RUN mkdir -p /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

RUN apk update

RUN npm install

COPY . .

ENTRYPOINT ["sh", "/home/node/app/docker-entrypoint.sh"]