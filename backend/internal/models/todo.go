package models

import (
	"time"
)

type TodoStatus string

const (
	StatusPending    TodoStatus = "Pending"
	StatusInProgress TodoStatus = "In Progress"
	StatusDone       TodoStatus = "Done"
)

// Todo defines the todo item model
// @name Todo
type Todo struct {
	ID          uint       `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	Title       string     `gorm:"not null" json:"title"`
	Description string     `json:"description,omitempty"`
	ImageURL    string     `gorm:"type:text" json:"image_url,omitempty"`
	Status      TodoStatus `gorm:"type:varchar(20);default:'Pending';not null" json:"status"`
	UserID      uint       `gorm:"not null" json:"user_id"`
	User        User       `gorm:"foreignKey:UserID" json:"-"`
}

// CreateTodoRequest defines the structure for creating a todo
// @name CreateTodoRequest
type CreateTodoRequest struct {
	Title       string `json:"title" validate:"required,min=1,max=255"`
	Description string `json:"description" validate:"max=1000"`
	ImageURL    string `json:"image_url" validate:"omitempty,url"`
}

// UpdateTodoRequest defines the structure for updating todo content
// @name UpdateTodoRequest
type UpdateTodoRequest struct {
	Title       *string `json:"title" validate:"omitempty,min=1,max=255"`
	Description *string `json:"description" validate:"omitempty,max=1000"`
	ImageURL    *string `json:"image_url" validate:"omitempty,url"`
}

// UpdateTodoStatusRequest defines the structure for updating todo status
// @name UpdateTodoStatusRequest
type UpdateTodoStatusRequest struct {
	Status TodoStatus `json:"status" validate:"required,oneof=Pending 'In Progress' Done"`
}
