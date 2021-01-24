FROM node:14-alpine3.12 as builder
ADD . /app
WORKDIR /app
RUN npm install
RUN npm run build

FROM nginx:alpine
RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/*
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 3000
