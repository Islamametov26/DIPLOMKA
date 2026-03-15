# syntax=docker/dockerfile:1

FROM golang:1.23-alpine AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/app ./cmd/main.go

FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates wget

COPY --from=build /out/app ./app
COPY migrations ./migrations

EXPOSE 8080

CMD ["./app"]
