package httpapi

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"islamdiplom/internal/service"
)

func NewRouter(
	eventService *service.EventService,
	venueService *service.VenueService,
	categoryService *service.CategoryService,
	authService *service.AuthService,
	bookingService *service.BookingService,
) http.Handler {
	router := gin.New()
	router.Use(
		gin.Logger(),
		gin.Recovery(),
		corsMiddleware(),
	)

	eventHandler := NewEventHandler(eventService)
	venueHandler := NewVenueHandler(venueService)
	categoryHandler := NewCategoryHandler(categoryService)
	authHandler := NewAuthHandler(authService)
	bookingHandler := NewBookingHandler(bookingService)

	router.GET("/health", healthHandler)

	api := router.Group("/api")
	{
		api.GET("/events", eventHandler.List)
		api.GET("/events/:id", eventHandler.Get)
		api.GET("/venues", venueHandler.List)
		api.GET("/venues/:id", venueHandler.Get)
		api.GET("/categories", categoryHandler.List)
		api.GET("/categories/:id", categoryHandler.Get)

		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)

		api.GET("/profile", authMiddleware(authService), authHandler.Profile)

		api.POST("/events", authMiddleware(authService), eventHandler.Create)
		api.PUT("/events/:id", authMiddleware(authService), eventHandler.Update)

		bookings := api.Group("/bookings", authMiddleware(authService))
		{
			bookings.GET("", bookingHandler.List)
			bookings.POST("", bookingHandler.Create)
			bookings.DELETE("/:id", bookingHandler.Cancel)
		}
	}

	return router
}

func healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
