package service

import (
	"context"

	"github.com/google/uuid"
	"islamdiplom/internal/domain"
	"islamdiplom/internal/repository"
)

const (
	bookingStatusActive   = "active"
	bookingStatusCanceled = "canceled"
	defaultCurrency       = "KZT"
	defaultSeatPrice      = 2500
)

type BookingService struct {
	repo      repository.BookingRepository
	events    repository.EventRepository
}

func NewBookingService(repo repository.BookingRepository, events repository.EventRepository) *BookingService {
	return &BookingService{repo: repo, events: events}
}

func (s *BookingService) List(ctx context.Context, userID uuid.UUID) ([]domain.Booking, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *BookingService) Create(ctx context.Context, userID uuid.UUID, eventID uuid.UUID, seats []string) (domain.Booking, error) {
	if len(seats) == 0 {
		return domain.Booking{}, repository.ErrConflict
	}

	if _, err := s.events.Get(ctx, eventID); err != nil {
		return domain.Booking{}, err
	}

	booking := domain.Booking{
		UserID:     userID,
		EventID:    eventID,
		Status:     bookingStatusActive,
		TotalPrice: len(seats) * defaultSeatPrice,
		Currency:   defaultCurrency,
		Seats:      seats,
	}

	return s.repo.Create(ctx, booking)
}

func (s *BookingService) Cancel(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.Cancel(ctx, id, userID)
}
