FROM node:latest

RUN apt-get update

RUN apt-get install postgresql-client -y

ENV PGDATABASE=PGDATABASE
ENV PGHOST=PGHOST
ENV PGPASSWORD=PGPASSWORD
ENV PGPORT=5565
ENV PGUSER=PGUSER

EXPOSE ${PGPORT} 3000

WORKDIR /usr/src/app

ADD . /usr/src/app

RUN npm install --omit=dev

RUN npm run build

CMD npm run run