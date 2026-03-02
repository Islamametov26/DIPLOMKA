package memory

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"islamdiplom/internal/domain"
	"islamdiplom/internal/repository"
)

type CategoryRepository struct {
	categories []domain.Category
}

func NewCategoryRepository() *CategoryRepository {
	now := time.Now().UTC()
	return &CategoryRepository{
		categories: []domain.Category{
			{
				ID:        uuid.New(),
				Name:      "Выставки",
				CreatedAt: now.Add(-72 * time.Hour),
				UpdatedAt: now.Add(-48 * time.Hour),
			},
		},
	}
}

func (r *CategoryRepository) List(_ context.Context) ([]domain.Category, error) {
	return append([]domain.Category(nil), r.categories...), nil
}

func (r *CategoryRepository) Get(_ context.Context, id uuid.UUID) (domain.Category, error) {
	for _, category := range r.categories {
		if category.ID == id {
			return category, nil
		}
	}
	return domain.Category{}, repository.ErrNotFound
}

func (r *CategoryRepository) Create(_ context.Context, category domain.Category) (domain.Category, error) {
	name := strings.TrimSpace(category.Name)
	if name == "" {
		return domain.Category{}, repository.ErrInvalid
	}

	for _, existing := range r.categories {
		if strings.EqualFold(strings.TrimSpace(existing.Name), name) {
			return domain.Category{}, repository.ErrConflict
		}
	}

	now := time.Now().UTC()
	if category.ID == uuid.Nil {
		category.ID = uuid.New()
	}
	category.Name = name
	category.CreatedAt = now
	category.UpdatedAt = now
	r.categories = append(r.categories, category)

	return category, nil
}
