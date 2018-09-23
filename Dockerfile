FROM mhart/alpine-node:10.11

WORKDIR /app
COPY . .

RUN npm install

EXPOSE 3400

CMD ["node", "index.js"]