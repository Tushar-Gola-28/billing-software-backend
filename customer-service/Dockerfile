# gateway-service/Dockerfile
FROM node:20-alpine

# set working directory
WORKDIR /usr/src/app

ENV NODE_ENV=production 
# install dependencies
COPY customer-service/package*.json ./
RUN npm install --only=production

# copy source code
COPY customer-service/ ./

# expose port (adjust if needed)
EXPOSE 4002

# start server
CMD ["node", "src/server.js"]