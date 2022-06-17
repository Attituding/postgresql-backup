FROM node:latest

RUN apt-get update

RUN apt-get install postgresql-client -y

EXPOSE 3000

WORKDIR /usr/src/app

ADD . /usr/src/app

RUN npm install --omit=dev

RUN npm install typescript

RUN npm run build

RUN npm uninstall typescript

CMD npm run run