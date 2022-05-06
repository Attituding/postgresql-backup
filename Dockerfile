FROM node:latest

RUN apt-get update

RUN apt-get install postgresql-client -y

ENV PGDATABASE=railway
ENV PGHOST=containers-us-west-36.railway.app
ENV PGPASSWORD=VUvkDhEEAXHffWVtXjZR
ENV PGPORT=5565
ENV PGUSER=postgres

EXPOSE ${PGPORT} 3000

WORKDIR /usr/src/app

ADD . /usr/src/app

RUN npm install --omit=dev

RUN npm run build

CMD npm run run