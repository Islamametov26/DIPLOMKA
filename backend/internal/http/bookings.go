package httpapi

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"islamdiplom/internal/repository"
	"islamdiplom/internal/service"
)

type BookingHandler struct {
	service *service.BookingService
}

type bookingRequest struct {
	EventID uuid.UUID `json:"eventId"`
	Seats   []string  `json:"seats"`
}

func NewBookingHandler(service *service.BookingService) *BookingHandler {
	return &BookingHandler{service: service}
}

func (h *BookingHandler) List(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	bookings, err := h.service.List(c.Request.Context(), userID)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"items": bookings})
}

func (h *BookingHandler) Create(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var payload bookingRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, http.StatusBadRequest, "invalid payload")
		return
	}

	booking, err := h.service.Create(c.Request.Context(), userID, payload.EventID, payload.Seats)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, booking)
}

func (h *BookingHandler) Cancel(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	bookingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		writeError(c, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.service.Cancel(c.Request.Context(), bookingID, userID); err != nil {
		if err == repository.ErrNotFound {
			writeError(c, http.StatusNotFound, "not found")
			return
		}
		writeServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *BookingHandler) Seats(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		writeError(c, http.StatusBadRequest, "invalid id")
		return
	}

	seats, err := h.service.ListSeatsByEvent(c.Request.Context(), eventID)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"items": seats})
}

func getUserID(c *gin.Context) (uuid.UUID, bool) {
	value := c.GetString("user_id")
	if value == "" {
		return uuid.UUID{}, false
	}
	id, err := uuid.Parse(value)
	if err != nil {
		return uuid.UUID{}, false
	}
	return id, true
}
