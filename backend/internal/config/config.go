package config

import "os"

type Config struct {
	HTTPAddr    string
	DatabaseURL string
	LogMode     string
	MigrationsDir string
	JWTSecret   string
	JWTTTL      string
}

func Load() Config {
	return Config{
		HTTPAddr:    getEnv("HTTP_ADDR", ":8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/islamdiplom?sslmode=disable"),
		LogMode:     getEnv("LOG_MODE", "dev"),
		MigrationsDir: getEnv("MIGRATIONS_DIR", "migrations"),
		JWTSecret:   getEnv("JWT_SECRET", "change-me"),
		JWTTTL:      getEnv("JWT_TTL", "24h"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
