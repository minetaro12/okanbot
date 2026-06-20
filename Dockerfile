FROM alpine:3.24.1

WORKDIR /app
COPY . ./
RUN apk update && \
  apk add --no-cache nodejs pnpm && \
  chmod +x /usr/local/bin/yt-dlp && \
  pnpm install --only=production

EXPOSE 3000

ENTRYPOINT [ "node", "src/main.ts" ]
