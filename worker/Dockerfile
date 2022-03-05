FROM node:16-alpine3.15 AS builder
ADD . /app
WORKDIR /app
RUN npm install

FROM gcr.io/distroless/nodejs:16
COPY --from=builder /app /app
WORKDIR /app

CMD ["index.js"]
