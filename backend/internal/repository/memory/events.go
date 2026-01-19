package memory

import (
	"context"
	"time"

	"github.com/google/uuid"
	"islamdiplom/internal/domain"
	"islamdiplom/internal/repository"
)

type EventRepository struct {
	events []domain.Event
}

func NewEventRepository() *EventRepository {
	now := time.Now().UTC()
	venueID := uuid.New()
	return &EventRepository{
		events: []domain.Event{
			{
				ID:          uuid.New(),
				Title:       "Открытие выставки",
				Description: "Вечер современного искусства с куратором.",
				StartAt:     now.Add(48 * time.Hour),
				EndAt:       now.Add(50 * time.Hour),
				VenueID:     venueID,
				Published:   true,
				CreatedAt:   now.Add(-24 * time.Hour),
				UpdatedAt:   now.Add(-2 * time.Hour),
			},
		},
	}
}

func (r *EventRepository) List(_ context.Context) ([]domain.Event, error) {
	return append([]domain.Event(nil), r.events...), nil
}

func (r *EventRepository) Get(_ context.Context, id uuid.UUID) (domain.Event, error) {
	for _, event := range r.events {
		if event.ID == id {
			return event, nil
		}
	}
	return domain.Event{}, repository.ErrNotFound
}

func (r *EventRepository) Create(_ context.Context, event domain.Event) (domain.Event, error) {
	now := time.Now().UTC()
	event.ID = uuid.New()
	event.CreatedAt = now
	event.UpdatedAt = now
	r.events = append(r.events, event)
	return event, nil
}

func (r *EventRepository) Update(_ context.Context, event domain.Event) (domain.Event, error) {
	for i, existing := range r.events {
		if existing.ID == event.ID {
			event.CreatedAt = existing.CreatedAt
			event.UpdatedAt = time.Now().UTC()
			r.events[i] = event
			return event, nil
		}
	}
	return domain.Event{}, repository.ErrNotFound
}
