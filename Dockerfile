# always start a dockerfile by importing a base image...
# i guess we want node? --version showed 18.18.0
FROM node:18-alpine

WORKDIR /app

# prep node
COPY ./package.json ./package-lock.json ./
RUN npm install

# copy stuff from files onto the image
# COPY <src (host)> <dest (image)>
COPY . .

ENV SERVER_PORT=3000
ENV SERVER_IP="127.0.0.1"
ENV DB_PASSWORD="pg"
ENV DB_PORT="5432"

ENV PORT=8080


# post for website
EXPOSE 3000

# commands run to launch application
# CMD [ "npm", "start" ]
# CMD ["node", "demoserver.js"]
CMD ["node", "server.js"]



