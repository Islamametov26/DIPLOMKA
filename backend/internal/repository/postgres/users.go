package postgres

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"islamdiplom/internal/domain"
	"islamdiplom/internal/repository"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user domain.User) (domain.User, error) {
	row := r.db.QueryRowContext(ctx, `
		INSERT INTO users (username, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, username, email, password_hash, created_at, updated_at
	`, user.Username, user.Email, user.PasswordHash)

	if err := row.Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt); err != nil {
		if isUniqueViolation(err) {
			return domain.User{}, repository.ErrConflict
		}
		return domain.User{}, err
	}

	return user, nil
}

func (r *UserRepository) GetByUsername(ctx context.Context, username string) (domain.User, error) {
	var user domain.User
	row := r.db.QueryRowContext(ctx, `
		SELECT id, username, email, password_hash, created_at, updated_at
		FROM users
		WHERE username = $1
	`, username)
	if err := row.Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.User{}, repository.ErrNotFound
		}
		return domain.User{}, err
	}

	return user, nil
}

func (r *UserRepository) Get(ctx context.Context, id uuid.UUID) (domain.User, error) {
	var user domain.User
	row := r.db.QueryRowContext(ctx, `
		SELECT id, username, email, password_hash, created_at, updated_at
		FROM users
		WHERE id = $1
	`, id)
	if err := row.Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.User{}, repository.ErrNotFound
		}
		return domain.User{}, err
	}

	return user, nil
}
