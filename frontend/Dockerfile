FROM node

WORKDIR /usr/src/app

COPY package*.json ./
COPY *.js ./
COPY routes/ ./routes

RUN npm install --silent

EXPOSE 3000

# run the application
CMD ["node", "index.js"]