FROM ubuntu:20.04

RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y build-essential git curl zip inotify-tools python

RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - && apt-get install -y nodejs

RUN git clone https://github.com/detroxx92/ttfkit.git ttfkit \
    && cd ttfkit \
    && npm install

WORKDIR /ttfkit

CMD [ "node", "/ttfkit/src/server.js" ]
