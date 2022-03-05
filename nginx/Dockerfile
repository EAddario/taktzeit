FROM nginx:1.21.6-alpine
RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/*
COPY ./default.conf /etc/nginx/conf.d/default.conf
