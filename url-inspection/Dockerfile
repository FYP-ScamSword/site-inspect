FROM node:latest
WORKDIR /app
COPY ["wait-for-it.sh", "./"]
COPY ["package.json", "package-lock.json*", "./"]
RUN chmod +x wait-for-it.sh
RUN npm install
COPY . .
CMD node server.js
