package memory

import (
	"context"
	"time"

	"github.com/google/uuid"
	"islamdiplom/internal/domain"
	"islamdiplom/internal/repository"
)

type VenueRepository struct {
	venues []domain.Venue
}

func NewVenueRepository() *VenueRepository {
	now := time.Now().UTC()
	return &VenueRepository{
		venues: []domain.Venue{
			{
				ID:        uuid.New(),
				Name:      "Городская галерея",
				Address:   "ул. Центральная, 10",
				CreatedAt: now.Add(-48 * time.Hour),
				UpdatedAt: now.Add(-24 * time.Hour),
			},
		},
	}
}

func (r *VenueRepository) List(_ context.Context) ([]domain.Venue, error) {
	return append([]domain.Venue(nil), r.venues...), nil
}

func (r *VenueRepository) Get(_ context.Context, id uuid.UUID) (domain.Venue, error) {
	for _, venue := range r.venues {
		if venue.ID == id {
			return venue, nil
		}
	}
	return domain.Venue{}, repository.ErrNotFound
}

func (r *VenueRepository) Create(_ context.Context, venue domain.Venue) (domain.Venue, error) {
	now := time.Now().UTC()
	if venue.ID == uuid.Nil {
		venue.ID = uuid.New()
	}
	venue.CreatedAt = now
	venue.UpdatedAt = now
	r.venues = append(r.venues, venue)
	return venue, nil
}

func (r *VenueRepository) Update(_ context.Context, venue domain.Venue) (domain.Venue, error) {
	for i, existing := range r.venues {
		if existing.ID == venue.ID {
			venue.CreatedAt = existing.CreatedAt
			venue.UpdatedAt = time.Now().UTC()
			r.venues[i] = venue
			return venue, nil
		}
	}
	return domain.Venue{}, repository.ErrNotFound
}

func (r *VenueRepository) Delete(_ context.Context, id uuid.UUID) error {
	for i, existing := range r.venues {
		if existing.ID == id {
			r.venues = append(r.venues[:i], r.venues[i+1:]...)
			return nil
		}
	}
	return repository.ErrNotFound
}
