FROM node

WORKDIR /usr/src/app

COPY package*.json ./
COPY *.js ./

RUN npm install --silent

# run the application
CMD ["node", "worker.js"]