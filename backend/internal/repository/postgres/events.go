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
		SELECT e.id, e.title, e.description, e.image_url, e.trailer_url, e.gallery_urls, e.start_at, e.end_at, e.venue_id,
		       COALESCE(ec.category_id, '00000000-0000-0000-0000-000000000000'::uuid) AS category_id,
		       e.published, e.created_by, e.created_at, e.updated_at
		FROM events e
		LEFT JOIN LATERAL (
			SELECT category_id
			FROM event_categories
			WHERE event_id = e.id
			ORDER BY category_id
			LIMIT 1
		) ec ON true
		ORDER BY e.start_at ASC
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
			&event.ImageURL,
			&event.TrailerURL,
			&event.GalleryURLs,
			&event.StartAt,
			&event.EndAt,
			&event.VenueID,
			&event.CategoryID,
			&event.Published,
			&event.CreatedBy,
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
		SELECT e.id, e.title, e.description, e.image_url, e.trailer_url, e.gallery_urls, e.start_at, e.end_at, e.venue_id,
		       COALESCE(ec.category_id, '00000000-0000-0000-0000-000000000000'::uuid) AS category_id,
		       e.published, e.created_by, e.created_at, e.updated_at
		FROM events e
		LEFT JOIN LATERAL (
			SELECT category_id
			FROM event_categories
			WHERE event_id = e.id
			ORDER BY category_id
			LIMIT 1
		) ec ON true
		WHERE e.id = $1
	`, id)
	if err := row.Scan(
		&event.ID,
		&event.Title,
		&event.Description,
		&event.ImageURL,
		&event.TrailerURL,
		&event.GalleryURLs,
		&event.StartAt,
		&event.EndAt,
		&event.VenueID,
		&event.CategoryID,
		&event.Published,
		&event.CreatedBy,
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
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.Event{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	row := tx.QueryRowContext(ctx, `
		INSERT INTO events (title, description, image_url, trailer_url, gallery_urls, start_at, end_at, venue_id, published, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, title, description, image_url, trailer_url, gallery_urls, start_at, end_at, venue_id, published, created_by, created_at, updated_at
	`, event.Title, event.Description, event.ImageURL, event.TrailerURL, event.GalleryURLs, event.StartAt, event.EndAt, event.VenueID, event.Published, event.CreatedBy)

	if err := row.Scan(
		&event.ID,
		&event.Title,
		&event.Description,
		&event.ImageURL,
		&event.TrailerURL,
		&event.GalleryURLs,
		&event.StartAt,
		&event.EndAt,
		&event.VenueID,
		&event.Published,
		&event.CreatedBy,
		&event.CreatedAt,
		&event.UpdatedAt,
	); err != nil {
		if isForeignKeyViolation(err) {
			return domain.Event{}, repository.ErrInvalid
		}
		return domain.Event{}, err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO event_categories (event_id, category_id)
		VALUES ($1, $2)
	`, event.ID, event.CategoryID); err != nil {
		if isForeignKeyViolation(err) {
			return domain.Event{}, repository.ErrInvalid
		}
		return domain.Event{}, err
	}

	if err := tx.Commit(); err != nil {
		return domain.Event{}, err
	}
	return event, nil
}

func (r *EventRepository) Update(ctx context.Context, event domain.Event) (domain.Event, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.Event{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	row := tx.QueryRowContext(ctx, `
		UPDATE events
		SET title = $1,
		    description = $2,
		    image_url = $3,
		    trailer_url = $4,
		    gallery_urls = $5,
		    start_at = $6,
		    end_at = $7,
		    venue_id = $8,
		    published = $9,
		    updated_at = now()
		WHERE id = $10
		RETURNING id, title, description, image_url, trailer_url, gallery_urls, start_at, end_at, venue_id, published, created_by, created_at, updated_at
	`, event.Title, event.Description, event.ImageURL, event.TrailerURL, event.GalleryURLs, event.StartAt, event.EndAt, event.VenueID, event.Published, event.ID)

	if err := row.Scan(
		&event.ID,
		&event.Title,
		&event.Description,
		&event.ImageURL,
		&event.TrailerURL,
		&event.GalleryURLs,
		&event.StartAt,
		&event.EndAt,
		&event.VenueID,
		&event.Published,
		&event.CreatedBy,
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

	if _, err := tx.ExecContext(ctx, `DELETE FROM event_categories WHERE event_id = $1`, event.ID); err != nil {
		return domain.Event{}, err
	}
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO event_categories (event_id, category_id)
		VALUES ($1, $2)
	`, event.ID, event.CategoryID); err != nil {
		if isForeignKeyViolation(err) {
			return domain.Event{}, repository.ErrInvalid
		}
		return domain.Event{}, err
	}

	if err := tx.Commit(); err != nil {
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
