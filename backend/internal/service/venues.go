package service

import (
	"context"

	"github.com/google/uuid"
	"islamdiplom/internal/domain"
	"islamdiplom/internal/repository"
)

type VenueService struct {
	repo repository.VenueRepository
}

func NewVenueService(repo repository.VenueRepository) *VenueService {
	return &VenueService{repo: repo}
}

func (s *VenueService) List(ctx context.Context) ([]domain.Venue, error) {
	return s.repo.List(ctx)
}

func (s *VenueService) Get(ctx context.Context, id uuid.UUID) (domain.Venue, error) {
	return s.repo.Get(ctx, id)
}

func (s *VenueService) Create(ctx context.Context, venue domain.Venue) (domain.Venue, error) {
	return s.repo.Create(ctx, venue)
}

func (s *VenueService) Update(ctx context.Context, venue domain.Venue) (domain.Venue, error) {
	return s.repo.Update(ctx, venue)
}

func (s *VenueService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
