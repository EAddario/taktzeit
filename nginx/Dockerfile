FROM nginx:1.27.0-alpine
RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/*
COPY ./default.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=10s --timeout=10s --retries=4 --start-period=30s CMD ["/usr/bin/curl", "http://localhost/health", "-f"]
