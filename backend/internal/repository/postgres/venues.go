package postgres

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"islamdiplom/internal/domain"
	"islamdiplom/internal/repository"
)

type VenueRepository struct {
	db *sql.DB
}

func NewVenueRepository(db *sql.DB) *VenueRepository {
	return &VenueRepository{db: db}
}

func (r *VenueRepository) List(ctx context.Context) ([]domain.Venue, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, address, created_at, updated_at
		FROM venues
		ORDER BY name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var venues []domain.Venue
	for rows.Next() {
		var venue domain.Venue
		if err := rows.Scan(
			&venue.ID,
			&venue.Name,
			&venue.Address,
			&venue.CreatedAt,
			&venue.UpdatedAt,
		); err != nil {
			return nil, err
		}
		venues = append(venues, venue)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return venues, nil
}

func (r *VenueRepository) Get(ctx context.Context, id uuid.UUID) (domain.Venue, error) {
	var venue domain.Venue
	row := r.db.QueryRowContext(ctx, `
		SELECT id, name, address, created_at, updated_at
		FROM venues
		WHERE id = $1
	`, id)
	if err := row.Scan(
		&venue.ID,
		&venue.Name,
		&venue.Address,
		&venue.CreatedAt,
		&venue.UpdatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.Venue{}, repository.ErrNotFound
		}
		return domain.Venue{}, err
	}

	return venue, nil
}
