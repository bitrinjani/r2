FROM node:9.3.0

ENV HOME /r2
WORKDIR $HOME

COPY package.json package-lock.json $HOME/
RUN npm install

COPY . $HOME
CMD npm start
