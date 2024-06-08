FROM node:22-alpine3.19 AS builder
ADD . /app
WORKDIR /app
RUN npm install

FROM gcr.io/distroless/nodejs22-debian12
COPY --from=builder /app /app
WORKDIR /app

CMD ["index.js"]
