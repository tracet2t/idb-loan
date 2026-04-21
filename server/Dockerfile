FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Environment variable for MongoDB
ENV MONGO_URI=mongodb://mongo:27017/idb_loans

EXPOSE 5000

CMD ["node", "server.js"]