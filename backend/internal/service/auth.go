package service

import (
	"context"
	"errors"
	"fmt"
	"regexp"
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

var usernamePattern = regexp.MustCompile(`^[\p{L}0-9_][\p{L}0-9_.-]{2,31}$`)

func NewAuthService(users repository.UserRepository, secret string, ttl time.Duration) *AuthService {
	return &AuthService{users: users, jwtSecret: []byte(secret), ttl: ttl}
}

func (s *AuthService) Register(ctx context.Context, username, password string) (domain.User, string, error) {
	username = normalizeUsername(username)
	if username == "" || password == "" || !usernamePattern.MatchString(username) {
		return domain.User{}, "", repository.ErrInvalid
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return domain.User{}, "", err
	}

	// Keep email for compatibility with existing schema and downstream consumers.
	user := domain.User{
		Username:     username,
		Email:        fmt.Sprintf("%s@afisha.local", username),
		PasswordHash: string(hash),
	}
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

func (s *AuthService) Login(ctx context.Context, username, password string) (domain.User, string, error) {
	username = normalizeUsername(username)
	if username == "" || password == "" {
		return domain.User{}, "", repository.ErrUnauthorized
	}

	user, err := s.users.GetByUsername(ctx, username)
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

func normalizeUsername(value string) string {
	return strings.TrimSpace(strings.ToLower(value))
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
