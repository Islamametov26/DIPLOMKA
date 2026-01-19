# syntax=docker/dockerfile:1
FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod ./
RUN go mod download

COPY . ./
RUN go build -o /bin/api ./cmd;

FROM alpine:3.19

WORKDIR /app

RUN adduser -D appuser
USER appuser

COPY --from=builder /bin/api /bin/api
COPY --from=builder /app/migrations /app/migrations

EXPOSE 8080

ENV HTTP_ADDR=:8080

ENTRYPOINT ["/bin/api"]
