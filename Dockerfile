FROM node:18-alpine

RUN apk add --no-cache libc6-compat gcompat

LABEL org.opencontainers.image.source=https://github.com/XCQ0607/xproxy
LABEL org.opencontainers.image.description="nodejs xproxy docker image"
LABEL org.opencontainers.image.licenses=MIT

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

# Environment variables with defaults (can be overridden at runtime)
ENV HTTP_PORT=3000
ENV SOCKS5_PORT=3001
ENV USER=admin
ENV PASSWORD=12345678
ENV AUTH=true

EXPOSE 3000 3001

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
