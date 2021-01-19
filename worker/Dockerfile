FROM node:14-alpine3.12
RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/* && \
    adduser --disabled-password --shell /bin/ash --ingroup users user
USER user
WORKDIR /home/user
COPY ./package.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "start"]
