package httpapi

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"islamdiplom/internal/domain"
	"islamdiplom/internal/repository"
	"islamdiplom/internal/service"
)

type EventHandler struct {
	service *service.EventService
}

type VenueHandler struct {
	service *service.VenueService
}

type CategoryHandler struct {
	service *service.CategoryService
}

func NewEventHandler(service *service.EventService) *EventHandler {
	return &EventHandler{service: service}
}

func NewVenueHandler(service *service.VenueService) *VenueHandler {
	return &VenueHandler{service: service}
}

func NewCategoryHandler(service *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

func (h *EventHandler) List(c *gin.Context) {
	events, err := h.service.List(c.Request.Context())
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"items": events})
}

func (h *EventHandler) Get(c *gin.Context) {
	id, ok := parseUUID(c.Param("id"))
	if !ok {
		writeError(c, http.StatusBadRequest, "invalid id")
		return
	}

	event, err := h.service.Get(c.Request.Context(), id)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, event)
}

type eventPayload struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartAt     string    `json:"startAt"`
	EndAt       string    `json:"endAt"`
	VenueID     uuid.UUID `json:"venueId"`
	Published   bool      `json:"published"`
}

func (h *EventHandler) Create(c *gin.Context) {
	var payload eventPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, http.StatusBadRequest, "invalid payload")
		return
	}

	event, ok := parseEventPayload(payload)
	if !ok {
		writeError(c, http.StatusBadRequest, "invalid payload")
		return
	}

	created, err := h.service.Create(c.Request.Context(), event)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, created)
}

func (h *EventHandler) Update(c *gin.Context) {
	id, ok := parseUUID(c.Param("id"))
	if !ok {
		writeError(c, http.StatusBadRequest, "invalid id")
		return
	}

	var payload eventPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, http.StatusBadRequest, "invalid payload")
		return
	}

	event, ok := parseEventPayload(payload)
	if !ok {
		writeError(c, http.StatusBadRequest, "invalid payload")
		return
	}
	event.ID = id

	updated, err := h.service.Update(c.Request.Context(), event)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, updated)
}

func (h *EventHandler) Delete(c *gin.Context) {
	id, ok := parseUUID(c.Param("id"))
	if !ok {
		writeError(c, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.service.Delete(c.Request.Context(), id); err != nil {
		writeServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *VenueHandler) List(c *gin.Context) {
	venues, err := h.service.List(c.Request.Context())
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"items": venues})
}

func (h *VenueHandler) Get(c *gin.Context) {
	id, ok := parseUUID(c.Param("id"))
	if !ok {
		writeError(c, http.StatusBadRequest, "invalid id")
		return
	}

	venue, err := h.service.Get(c.Request.Context(), id)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, venue)
}

type venuePayload struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Address string `json:"address"`
}

func (h *VenueHandler) Create(c *gin.Context) {
	var payload venuePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, http.StatusBadRequest, "invalid payload")
		return
	}
	venue, ok := parseVenuePayload(payload)
	if !ok {
		writeError(c, http.StatusBadRequest, "invalid payload")
		return
	}

	created, err := h.service.Create(c.Request.Context(), venue)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, created)
}

func (h *VenueHandler) Update(c *gin.Context) {
	id, ok := parseUUID(c.Param("id"))
	if !ok {
		writeError(c, http.StatusBadRequest, "invalid id")
		return
	}
	var payload venuePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, http.StatusBadRequest, "invalid payload")
		return
	}
	venue, ok := parseVenuePayload(payload)
	if !ok {
		writeError(c, http.StatusBadRequest, "invalid payload")
		return
	}
	venue.ID = id

	updated, err := h.service.Update(c.Request.Context(), venue)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, updated)
}

func (h *VenueHandler) Delete(c *gin.Context) {
	id, ok := parseUUID(c.Param("id"))
	if !ok {
		writeError(c, http.StatusBadRequest, "invalid id")
		return
	}
	if err := h.service.Delete(c.Request.Context(), id); err != nil {
		writeServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *CategoryHandler) List(c *gin.Context) {
	categories, err := h.service.List(c.Request.Context())
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"items": categories})
}

func (h *CategoryHandler) Get(c *gin.Context) {
	id, ok := parseUUID(c.Param("id"))
	if !ok {
		writeError(c, http.StatusBadRequest, "invalid id")
		return
	}

	category, err := h.service.Get(c.Request.Context(), id)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, category)
}

func parseUUID(raw string) (uuid.UUID, bool) {
	id, err := uuid.Parse(raw)
	if err != nil {
		return uuid.UUID{}, false
	}
	return id, true
}

func parseEventPayload(payload eventPayload) (domain.Event, bool) {
	if payload.Title == "" || payload.Description == "" || payload.VenueID == uuid.Nil {
		return domain.Event{}, false
	}

	startAt, err := time.Parse(time.RFC3339, payload.StartAt)
	if err != nil {
		return domain.Event{}, false
	}
	endAt, err := time.Parse(time.RFC3339, payload.EndAt)
	if err != nil {
		return domain.Event{}, false
	}

	return domain.Event{
		Title:       payload.Title,
		Description: payload.Description,
		StartAt:     startAt.UTC(),
		EndAt:       endAt.UTC(),
		VenueID:     payload.VenueID,
		Published:   payload.Published,
	}, true
}

func parseVenuePayload(payload venuePayload) (domain.Venue, bool) {
	if payload.Name == "" || payload.Address == "" {
		return domain.Venue{}, false
	}
	venue := domain.Venue{
		Name:    payload.Name,
		Address: payload.Address,
	}
	if payload.ID != "" {
		id, err := uuid.Parse(payload.ID)
		if err != nil {
			return domain.Venue{}, false
		}
		venue.ID = id
	}
	return venue, true
}

func writeError(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"error": message})
}

func writeServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, repository.ErrNotFound):
		writeError(c, http.StatusNotFound, "not found")
	case errors.Is(err, repository.ErrConflict):
		writeError(c, http.StatusConflict, "conflict")
	case errors.Is(err, repository.ErrUnauthorized):
		writeError(c, http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, repository.ErrInvalid):
		writeError(c, http.StatusBadRequest, "invalid")
	default:
		writeError(c, http.StatusInternalServerError, "internal error")
	}
}
