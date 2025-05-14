# gateway-service/Dockerfile
FROM node:20-alpine

# set working directory
WORKDIR /usr/src/app

ENV NODE_ENV=production 
# install dependencies
COPY api-gateway/package*.json ./
RUN npm install --only=production

# copy source code
COPY api-gateway/ ./

# expose port (adjust if needed)
EXPOSE 4001

# start server
CMD ["node", "src/server.js"]