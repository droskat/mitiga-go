FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Use the docker config (empty defaults — real values come from env vars at runtime)
COPY cmd/config.go.docker cmd/config.go

RUN CGO_ENABLED=0 GOOS=linux go build -o /mitiga-server ./cmd/

# --- Runtime ---
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /mitiga-server /mitiga-server

EXPOSE 8080

ENTRYPOINT ["/mitiga-server"]
