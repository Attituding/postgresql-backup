FROM node:latest

RUN apt-get update

RUN apt-get install postgresql-client -y

# EXPOSE YOURPORTHERE
EXPOSE 3000 

WORKDIR /usr/src/app

ADD . /usr/src/app

RUN npm install

RUN npm run build

RUN npm i --omit=dev

CMD npm run run