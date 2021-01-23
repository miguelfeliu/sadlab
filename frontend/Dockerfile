# our base image
# docker build -t carrito .
# docker run -it carrito
FROM node

WORKDIR /usr/src/app

COPY package*.json ./
COPY *.js ./
COPY .env ./

RUN npm install

# run the application
CMD ["node", "index.js"]s