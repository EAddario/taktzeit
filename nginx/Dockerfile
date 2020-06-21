FROM nginx:alpine
RUN apk update && \
    apk upgrade
COPY ./default.conf /etc/nginx/conf.d/default.conf
