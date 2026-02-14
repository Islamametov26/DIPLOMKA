package domain

import (
	"time"

	"github.com/google/uuid"
)

type Booking struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"userId"`
	EventID    uuid.UUID `json:"eventId"`
	EventTitle string    `json:"eventTitle"`
	EventImage string    `json:"eventImage"`
	EventStart time.Time `json:"eventStart"`
	EventEnd   time.Time `json:"eventEnd"`
	VenueName  string    `json:"venueName"`
	Status     string    `json:"status"`
	TotalPrice int       `json:"totalPrice"`
	Currency   string    `json:"currency"`
	Seats      []string  `json:"seats"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}
