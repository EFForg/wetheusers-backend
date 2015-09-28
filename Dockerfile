FROM node
MAINTAINER William Budington <bill@eff.org>

RUN mkdir /app
WORKDIR /app

ADD package.json ./
RUN npm install

ADD server.js gulpfile.js Procfile entrypoint.sh ./
ADD api ./api/
ADD bin ./bin/
ADD config ./config/
ADD db ./db/
ADD gulp ./gulp/
ADD lib ./lib/

CMD ["node_modules/gulp/bin/gulp.js", "runServer"]
ENTRYPOINT ["/app/entrypoint.sh"]
