# always start a dockerfile by importing a base image...
# i guess we want node? --version showed 18.18.0
FROM node:latest

WORKDIR /app

# prep node
COPY ./package.json ./package-lock.json /
RUN npm install

# copy stuff from files onto the image
# COPY <src (host)> <dest (image)>
COPY . .

# post for website
EXPOSE 3000

# commands run to launch application
CMD [ "node", "server.js" ]



