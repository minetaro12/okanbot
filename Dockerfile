FROM alpine:3.24.3

WORKDIR /app
COPY . ./
RUN apk update && \
  apk add --no-cache nodejs pnpm && \
  pnpm install --only=production --force

ENTRYPOINT [ "node", "src/main.ts" ]
