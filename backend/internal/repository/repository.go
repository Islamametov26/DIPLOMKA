package repository

import (
	"context"

	"github.com/google/uuid"
	"islamdiplom/internal/domain"
)

type EventRepository interface {
	List(ctx context.Context) ([]domain.Event, error)
	Get(ctx context.Context, id uuid.UUID) (domain.Event, error)
	Create(ctx context.Context, event domain.Event) (domain.Event, error)
	Update(ctx context.Context, event domain.Event) (domain.Event, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type VenueRepository interface {
	List(ctx context.Context) ([]domain.Venue, error)
	Get(ctx context.Context, id uuid.UUID) (domain.Venue, error)
	Create(ctx context.Context, venue domain.Venue) (domain.Venue, error)
	Update(ctx context.Context, venue domain.Venue) (domain.Venue, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type CategoryRepository interface {
	List(ctx context.Context) ([]domain.Category, error)
	Get(ctx context.Context, id uuid.UUID) (domain.Category, error)
	Create(ctx context.Context, category domain.Category) (domain.Category, error)
}

type UserRepository interface {
	Create(ctx context.Context, user domain.User) (domain.User, error)
	GetByUsername(ctx context.Context, username string) (domain.User, error)
	Get(ctx context.Context, id uuid.UUID) (domain.User, error)
}

type BookingRepository interface {
	ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Booking, error)
	Create(ctx context.Context, booking domain.Booking) (domain.Booking, error)
	Cancel(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	ListSeatsByEvent(ctx context.Context, eventID uuid.UUID) ([]string, error)
}
