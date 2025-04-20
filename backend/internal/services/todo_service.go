package services

import (
	"context"
	"errors"
	"github.com/xNatthapol/todo-list/internal/models"
	"github.com/xNatthapol/todo-list/internal/repositories"

	"gorm.io/gorm"
)

var (
	ErrTodoNotFound           = errors.New("todo not found")
	ErrForbidden              = errors.New("user does not have permission to access this resource")
	ErrNoUpdateFieldsProvided = errors.New("no update fields provided")
)

type TodoService interface {
	CreateTodo(ctx context.Context, userID uint, title string, description string) (*models.Todo, error)
	GetTodosByUserID(ctx context.Context, userID uint) ([]models.Todo, error)
	GetTodoByID(ctx context.Context, userID, todoID uint) (*models.Todo, error)
	UpdateTodo(ctx context.Context, userID, todoID uint, title *string, description *string) (*models.Todo, error)
	UpdateTodoStatus(ctx context.Context, userID, todoID uint, status models.TodoStatus) (*models.Todo, error)
	DeleteTodo(ctx context.Context, userID, todoID uint) error
}

type todoService struct {
	todoRepo repositories.TodoRepository
}

func NewTodoService(todoRepo repositories.TodoRepository) TodoService {
	return &todoService{todoRepo: todoRepo}
}

func (s *todoService) CreateTodo(ctx context.Context, userID uint, title string, description string) (*models.Todo, error) {
	todo := &models.Todo{
		Title:       title,
		Description: description,
		UserID:      userID,
		Status:      models.StatusPending,
	}

	err := s.todoRepo.CreateTodo(ctx, todo)
	if err != nil {
		return nil, err
	}
	return todo, nil
}

func (s *todoService) GetTodosByUserID(ctx context.Context, userID uint) ([]models.Todo, error) {
	return s.todoRepo.FindTodosByUserID(ctx, userID)
}

// checkOwnership verifies if the todo exists and belongs to the user
func (s *todoService) checkOwnership(ctx context.Context, userID, todoID uint) (*models.Todo, error) {
	todo, err := s.todoRepo.FindTodoByID(ctx, todoID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTodoNotFound
		}
		return nil, err
	}

	if todo.UserID != userID {
		return nil, ErrForbidden
	}
	return todo, nil
}

func (s *todoService) GetTodoByID(ctx context.Context, userID, todoID uint) (*models.Todo, error) {
	todo, err := s.checkOwnership(ctx, userID, todoID)
	if err != nil {
		return nil, err
	}
	return todo, nil
}

func (s *todoService) UpdateTodo(ctx context.Context, userID, todoID uint, title *string, description *string) (*models.Todo, error) {
	if title == nil && description == nil {
		return nil, ErrNoUpdateFieldsProvided
	}

	// checkOwnership verifies if the todo exists and belongs to the user
	todo, err := s.checkOwnership(ctx, userID, todoID)
	if err != nil {
		return nil, err
	}

	// Apply updates if fields were provided in the request
	updated := false
	if title != nil && todo.Title != *title {
		todo.Title = *title
		updated = true
	}
	if description != nil && todo.Description != *description {
		todo.Description = *description
		updated = true
	}

	// Only save if something actually changed
	if !updated {
		return todo, nil
	}

	err = s.todoRepo.UpdateTodo(ctx, todo)
	if err != nil {
		return nil, err
	}
	return todo, nil
}

func (s *todoService) UpdateTodoStatus(ctx context.Context, userID, todoID uint, status models.TodoStatus) (*models.Todo, error) {
	// checkOwnership verifies if the todo exists and belongs to the user
	todo, err := s.checkOwnership(ctx, userID, todoID)
	if err != nil {
		return nil, err
	}

	// Update status
	todo.Status = status

	err = s.todoRepo.UpdateTodo(ctx, todo)
	if err != nil {
		return nil, err
	}
	return todo, nil
}

func (s *todoService) DeleteTodo(ctx context.Context, userID, todoID uint) error {
	_, err := s.checkOwnership(ctx, userID, todoID)
	if err != nil {
		return err
	}

	err = s.todoRepo.DeleteTodo(ctx, todoID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrTodoNotFound
		}
		return err
	}
	return nil
}
