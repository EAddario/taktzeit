FROM node:22-alpine3.19 AS builder
ADD . /app
WORKDIR /app
RUN npm install
RUN npm run build

FROM nginx:1.27.0-alpine
RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/*
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 3010
