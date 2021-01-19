FROM node:14-alpine3.12 as builder
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/*
EXPOSE 3000
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
