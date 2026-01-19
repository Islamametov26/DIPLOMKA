package service

import (
	"context"

	"github.com/google/uuid"
	"islamdiplom/internal/domain"
	"islamdiplom/internal/repository"
)

type EventService struct {
	repo repository.EventRepository
}

func NewEventService(repo repository.EventRepository) *EventService {
	return &EventService{repo: repo}
}

func (s *EventService) List(ctx context.Context) ([]domain.Event, error) {
	return s.repo.List(ctx)
}

func (s *EventService) Get(ctx context.Context, id uuid.UUID) (domain.Event, error) {
	return s.repo.Get(ctx, id)
}

func (s *EventService) Create(ctx context.Context, event domain.Event) (domain.Event, error) {
	return s.repo.Create(ctx, event)
}

func (s *EventService) Update(ctx context.Context, event domain.Event) (domain.Event, error) {
	return s.repo.Update(ctx, event)
}
