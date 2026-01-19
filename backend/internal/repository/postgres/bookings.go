package postgres

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"islamdiplom/internal/domain"
	"islamdiplom/internal/repository"
)

type BookingRepository struct {
	db *sql.DB
}

func NewBookingRepository(db *sql.DB) *BookingRepository {
	return &BookingRepository{db: db}
}

func (r *BookingRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Booking, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, event_id, status, total_price, currency, created_at, updated_at
		FROM bookings
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []domain.Booking
	for rows.Next() {
		var booking domain.Booking
		if err := rows.Scan(
			&booking.ID,
			&booking.UserID,
			&booking.EventID,
			&booking.Status,
			&booking.TotalPrice,
			&booking.Currency,
			&booking.CreatedAt,
			&booking.UpdatedAt,
		); err != nil {
			return nil, err
		}
		bookings = append(bookings, booking)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(bookings) == 0 {
		return bookings, nil
	}

	seats, err := r.loadSeats(ctx, bookings)
	if err != nil {
		return nil, err
	}
	for i := range bookings {
		bookings[i].Seats = seats[bookings[i].ID]
	}

	return bookings, nil
}

func (r *BookingRepository) Create(ctx context.Context, booking domain.Booking) (domain.Booking, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.Booking{}, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	row := tx.QueryRowContext(ctx, `
		INSERT INTO bookings (user_id, event_id, status, total_price, currency)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, user_id, event_id, status, total_price, currency, created_at, updated_at
	`, booking.UserID, booking.EventID, booking.Status, booking.TotalPrice, booking.Currency)

	if err = row.Scan(
		&booking.ID,
		&booking.UserID,
		&booking.EventID,
		&booking.Status,
		&booking.TotalPrice,
		&booking.Currency,
		&booking.CreatedAt,
		&booking.UpdatedAt,
	); err != nil {
		return domain.Booking{}, err
	}

	for _, seat := range booking.Seats {
		if _, err = tx.ExecContext(ctx, `
			INSERT INTO booking_seats (booking_id, seat_label)
			VALUES ($1, $2)
		`, booking.ID, seat); err != nil {
			return domain.Booking{}, err
		}
	}

	if err = tx.Commit(); err != nil {
		return domain.Booking{}, err
	}

	return booking, nil
}

func (r *BookingRepository) Cancel(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE bookings
		SET status = 'canceled', updated_at = now()
		WHERE id = $1 AND user_id = $2 AND status = 'active'
	`, id, userID)
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

func (r *BookingRepository) loadSeats(ctx context.Context, bookings []domain.Booking) (map[uuid.UUID][]string, error) {
	ids := make([]uuid.UUID, 0, len(bookings))
	for _, booking := range bookings {
		ids = append(ids, booking.ID)
	}

	rows, err := r.db.QueryContext(ctx, `
		SELECT booking_id, seat_label
		FROM booking_seats
		WHERE booking_id = ANY($1)
		ORDER BY seat_label ASC
	`, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[uuid.UUID][]string, len(bookings))
	for rows.Next() {
		var bookingID uuid.UUID
		var seat string
		if err := rows.Scan(&bookingID, &seat); err != nil {
			return nil, err
		}
		result[bookingID] = append(result[bookingID], seat)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return result, nil
}
