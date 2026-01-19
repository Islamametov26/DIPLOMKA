package postgres

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"islamdiplom/internal/domain"
	"islamdiplom/internal/repository"
)

type EventRepository struct {
	db *sql.DB
}

func NewEventRepository(db *sql.DB) *EventRepository {
	return &EventRepository{db: db}
}

func (r *EventRepository) List(ctx context.Context) ([]domain.Event, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, title, description, start_at, end_at, venue_id, published, created_at, updated_at
		FROM events
		ORDER BY start_at ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []domain.Event
	for rows.Next() {
		var event domain.Event
		if err := rows.Scan(
			&event.ID,
			&event.Title,
			&event.Description,
			&event.StartAt,
			&event.EndAt,
			&event.VenueID,
			&event.Published,
			&event.CreatedAt,
			&event.UpdatedAt,
		); err != nil {
			return nil, err
		}
		events = append(events, event)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return events, nil
}

func (r *EventRepository) Get(ctx context.Context, id uuid.UUID) (domain.Event, error) {
	var event domain.Event
	row := r.db.QueryRowContext(ctx, `
		SELECT id, title, description, start_at, end_at, venue_id, published, created_at, updated_at
		FROM events
		WHERE id = $1
	`, id)
	if err := row.Scan(
		&event.ID,
		&event.Title,
		&event.Description,
		&event.StartAt,
		&event.EndAt,
		&event.VenueID,
		&event.Published,
		&event.CreatedAt,
		&event.UpdatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.Event{}, repository.ErrNotFound
		}
		return domain.Event{}, err
	}

	return event, nil
}

func (r *EventRepository) Create(ctx context.Context, event domain.Event) (domain.Event, error) {
	row := r.db.QueryRowContext(ctx, `
		INSERT INTO events (title, description, start_at, end_at, venue_id, published)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, title, description, start_at, end_at, venue_id, published, created_at, updated_at
	`, event.Title, event.Description, event.StartAt, event.EndAt, event.VenueID, event.Published)

	if err := row.Scan(
		&event.ID,
		&event.Title,
		&event.Description,
		&event.StartAt,
		&event.EndAt,
		&event.VenueID,
		&event.Published,
		&event.CreatedAt,
		&event.UpdatedAt,
	); err != nil {
		if isForeignKeyViolation(err) {
			return domain.Event{}, repository.ErrInvalid
		}
		return domain.Event{}, err
	}

	return event, nil
}

func (r *EventRepository) Update(ctx context.Context, event domain.Event) (domain.Event, error) {
	row := r.db.QueryRowContext(ctx, `
		UPDATE events
		SET title = $1,
		    description = $2,
		    start_at = $3,
		    end_at = $4,
		    venue_id = $5,
		    published = $6,
		    updated_at = now()
		WHERE id = $7
		RETURNING id, title, description, start_at, end_at, venue_id, published, created_at, updated_at
	`, event.Title, event.Description, event.StartAt, event.EndAt, event.VenueID, event.Published, event.ID)

	if err := row.Scan(
		&event.ID,
		&event.Title,
		&event.Description,
		&event.StartAt,
		&event.EndAt,
		&event.VenueID,
		&event.Published,
		&event.CreatedAt,
		&event.UpdatedAt,
	); err != nil {
		if isForeignKeyViolation(err) {
			return domain.Event{}, repository.ErrInvalid
		}
		if errors.Is(err, sql.ErrNoRows) {
			return domain.Event{}, repository.ErrNotFound
		}
		return domain.Event{}, err
	}

	return event, nil
}

func (r *EventRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM events WHERE id = $1`, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return repository.ErrNotFound
	}
	return nil
}
