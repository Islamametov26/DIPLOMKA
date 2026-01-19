package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/google/uuid"
	"islamdiplom/internal/domain"
	"islamdiplom/internal/repository"
)

type AuthService struct {
	users     repository.UserRepository
	jwtSecret []byte
	ttl       time.Duration
}

func NewAuthService(users repository.UserRepository, secret string, ttl time.Duration) *AuthService {
	return &AuthService{users: users, jwtSecret: []byte(secret), ttl: ttl}
}

func (s *AuthService) Register(ctx context.Context, email, password string) (domain.User, string, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || password == "" {
		return domain.User{}, "", repository.ErrConflict
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return domain.User{}, "", err
	}

	user := domain.User{Email: email, PasswordHash: string(hash)}
	created, err := s.users.Create(ctx, user)
	if err != nil {
		return domain.User{}, "", err
	}

	token, err := s.createToken(created.ID)
	if err != nil {
		return domain.User{}, "", err
	}

	return created, token, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (domain.User, string, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || password == "" {
		return domain.User{}, "", repository.ErrUnauthorized
	}

	user, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return domain.User{}, "", repository.ErrUnauthorized
		}
		return domain.User{}, "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return domain.User{}, "", repository.ErrUnauthorized
	}

	token, err := s.createToken(user.ID)
	if err != nil {
		return domain.User{}, "", err
	}

	return user, token, nil
}

func (s *AuthService) ParseToken(token string) (uuid.UUID, error) {
	parsed, err := jwt.Parse(token, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, repository.ErrUnauthorized
		}
		return s.jwtSecret, nil
	})
	if err != nil || !parsed.Valid {
		return uuid.UUID{}, repository.ErrUnauthorized
	}

	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return uuid.UUID{}, repository.ErrUnauthorized
	}

	sub, ok := claims["sub"].(string)
	if !ok {
		return uuid.UUID{}, repository.ErrUnauthorized
	}

	id, err := uuid.Parse(sub)
	if err != nil {
		return uuid.UUID{}, repository.ErrUnauthorized
	}

	return id, nil
}

func (s *AuthService) GetUser(ctx context.Context, id uuid.UUID) (domain.User, error) {
	return s.users.Get(ctx, id)
}

func (s *AuthService) createToken(userID uuid.UUID) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub": userID.String(),
		"iat": now.Unix(),
		"exp": now.Add(s.ttl).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}
