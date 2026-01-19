package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"islamdiplom/internal/domain"
	"islamdiplom/internal/repository"
)

type EventService struct {
	repo   repository.EventRepository
	venues repository.VenueRepository
}

func NewEventService(repo repository.EventRepository, venues repository.VenueRepository) *EventService {
	return &EventService{repo: repo, venues: venues}
}

func (s *EventService) List(ctx context.Context) ([]domain.Event, error) {
	return s.repo.List(ctx)
}

func (s *EventService) Get(ctx context.Context, id uuid.UUID) (domain.Event, error) {
	return s.repo.Get(ctx, id)
}

func (s *EventService) Create(ctx context.Context, event domain.Event) (domain.Event, error) {
	if err := s.ensureVenue(ctx, event.VenueID); err != nil {
		return domain.Event{}, err
	}
	return s.repo.Create(ctx, event)
}

func (s *EventService) Update(ctx context.Context, event domain.Event) (domain.Event, error) {
	if err := s.ensureVenue(ctx, event.VenueID); err != nil {
		return domain.Event{}, err
	}
	return s.repo.Update(ctx, event)
}

func (s *EventService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *EventService) ensureVenue(ctx context.Context, venueID uuid.UUID) error {
	if s.venues == nil {
		return nil
	}
	if venueID == uuid.Nil {
		return repository.ErrInvalid
	}
	_, err := s.venues.Get(ctx, venueID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return repository.ErrInvalid
		}
		return err
	}
	return nil
}
