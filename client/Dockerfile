FROM node:16-alpine3.15 AS builder
ADD . /app
WORKDIR /app
RUN npm install
RUN npm run build

FROM nginx:1.21.6-alpine
RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/*
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 3010
