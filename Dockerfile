FROM node:10.24.1

ENV HOME /r2
WORKDIR $HOME

COPY package.json package-lock.json $HOME/
RUN npm install

COPY . $HOME
CMD npm start
