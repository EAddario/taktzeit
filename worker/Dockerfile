FROM node:14-alpine3.13 AS builder
ADD . /app
WORKDIR /app
RUN npm install

FROM gcr.io/distroless/nodejs:14
COPY --from=builder /app /app
WORKDIR /app

CMD ["index.js"]
