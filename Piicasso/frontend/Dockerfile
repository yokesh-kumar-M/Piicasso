# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build


# This image is designed for unprivileged operation and keeps its writable
# PID/cache paths outside root-owned locations. Its default runtime user is 101.
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

USER root

COPY --from=builder --chown=101:101 /app/build /usr/share/nginx/html
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf

# The repository config is also used outside this image and listens on port 80.
# Adapt the image-local copy to the unprivileged port and assert the rewrite.
RUN sed -i 's/listen 80;/listen 8080;/' /etc/nginx/conf.d/default.conf \
    && grep -q 'listen 8080;' /etc/nginx/conf.d/default.conf

USER 101:101

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
