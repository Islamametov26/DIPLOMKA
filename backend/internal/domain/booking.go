package domain

import (
	"time"

	"github.com/google/uuid"
)

type Booking struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"userId"`
	EventID    uuid.UUID `json:"eventId"`
	Status     string    `json:"status"`
	TotalPrice int       `json:"totalPrice"`
	Currency   string    `json:"currency"`
	Seats      []string  `json:"seats"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}
