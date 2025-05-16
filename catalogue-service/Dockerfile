# gateway-service/Dockerfile
FROM node:20-alpine

# set working directory
WORKDIR /usr/src/app

ENV NODE_ENV=development 

# install dependencies
COPY catalogue-service/package*.json ./
RUN npm install --only=production

# copy source code
COPY event-service/ ./

# expose port (adjust if needed)
EXPOSE 4002

# start server
CMD ["node", "src/server.js"]