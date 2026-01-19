package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"islamdiplom/internal/config"
	"islamdiplom/internal/db"
	httpapi "islamdiplom/internal/http"
	"islamdiplom/internal/repository/postgres"
	"islamdiplom/internal/service"
)

func main() {
	cfg := config.Load()

	var logger *zap.Logger
	var err error
	if cfg.LogMode == "prod" {
		logger, err = zap.NewProduction()
	} else {
		logger, err = zap.NewDevelopment()
	}
	if err != nil {
		panic(err)
	}
	defer func() {
		_ = logger.Sync()
	}()

	dbConn, err := db.Open(context.Background(), cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("database connection error", zap.Error(err))
	}
	defer func() {
		if err := dbConn.Close(); err != nil {
			logger.Warn("database close error", zap.Error(err))
		}
	}()

	eventRepo := postgres.NewEventRepository(dbConn)
	venueRepo := postgres.NewVenueRepository(dbConn)
	categoryRepo := postgres.NewCategoryRepository(dbConn)
	userRepo := postgres.NewUserRepository(dbConn)
	bookingRepo := postgres.NewBookingRepository(dbConn)

	eventService := service.NewEventService(eventRepo)
	venueService := service.NewVenueService(venueRepo)
	categoryService := service.NewCategoryService(categoryRepo)
	bookingService := service.NewBookingService(bookingRepo, eventRepo)

	ttl, err := time.ParseDuration(cfg.JWTTTL)
	if err != nil {
		logger.Fatal("invalid JWT_TTL", zap.Error(err))
	}
	authService := service.NewAuthService(userRepo, cfg.JWTSecret, ttl)

	if err := db.ApplyMigrations(context.Background(), dbConn, cfg.MigrationsDir, logger); err != nil {
		logger.Fatal("migration error", zap.Error(err))
	}

	router := httpapi.NewRouter(eventService, venueService, categoryService, authService, bookingService)

	server := &http.Server{
		Addr:         cfg.HTTPAddr,
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	go func() {
		logger.Info("http server listening", zap.String("addr", cfg.HTTPAddr))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("http server error", zap.Error(err))
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		logger.Warn("http server shutdown error", zap.Error(err))
	}
}
