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
