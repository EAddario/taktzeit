FROM node:22-alpine3.19 AS builder
ADD . /app
WORKDIR /app
RUN npm install

FROM gcr.io/distroless/nodejs22-debian12
COPY --from=builder /app /app
WORKDIR /app

HEALTHCHECK --interval=10s --timeout=10s --retries=4 --start-period=30s CMD ["/nodejs/bin/node", "healthcheck.js"]

CMD ["index.js"]
