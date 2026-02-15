package service

import (
	"context"
	"strings"

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
	normalizedSeats := normalizeSeats(seats)
	if len(normalizedSeats) == 0 {
		return domain.Booking{}, repository.ErrInvalid
	}

	if _, err := s.events.Get(ctx, eventID); err != nil {
		return domain.Booking{}, err
	}

	booking := domain.Booking{
		UserID:     userID,
		EventID:    eventID,
		Status:     bookingStatusActive,
		TotalPrice: len(normalizedSeats) * defaultSeatPrice,
		Currency:   defaultCurrency,
		Seats:      normalizedSeats,
	}

	return s.repo.Create(ctx, booking)
}

func (s *BookingService) Cancel(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.Cancel(ctx, id, userID)
}

func (s *BookingService) ListSeatsByEvent(ctx context.Context, eventID uuid.UUID) ([]string, error) {
	return s.repo.ListSeatsByEvent(ctx, eventID)
}

func normalizeSeats(seats []string) []string {
	unique := make(map[string]struct{}, len(seats))
	result := make([]string, 0, len(seats))
	for _, seat := range seats {
		value := strings.ToUpper(strings.TrimSpace(seat))
		if value == "" {
			continue
		}
		if _, exists := unique[value]; exists {
			continue
		}
		unique[value] = struct{}{}
		result = append(result, value)
	}
	return result
}
