FROM nginx:1.27.0-alpine
RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/*
COPY ./default.conf /etc/nginx/conf.d/default.conf
