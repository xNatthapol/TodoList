package repositories

import (
	"context"
	"github.com/xNatthapol/todo-list/internal/models"

	"gorm.io/gorm"
)

type TodoRepository interface {
	CreateTodo(ctx context.Context, todo *models.Todo) error
	FindTodosByUserID(ctx context.Context, userID uint) ([]models.Todo, error)
	FindTodoByID(ctx context.Context, id uint) (*models.Todo, error)
	UpdateTodo(ctx context.Context, todo *models.Todo) error
	DeleteTodo(ctx context.Context, id uint) error
}

type todoRepository struct {
	db *gorm.DB
}

func NewTodoRepository(db *gorm.DB) TodoRepository {
	return &todoRepository{db: db}
}

func (r *todoRepository) CreateTodo(ctx context.Context, todo *models.Todo) error {
	result := r.db.WithContext(ctx).Create(todo)
	return result.Error
}

func (r *todoRepository) FindTodosByUserID(ctx context.Context, userID uint) ([]models.Todo, error) {
	var todos []models.Todo
	result := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at desc").Find(&todos)
	return todos, result.Error
}

func (r *todoRepository) FindTodoByID(ctx context.Context, id uint) (*models.Todo, error) {
	var todo models.Todo
	result := r.db.WithContext(ctx).First(&todo, id)
	return &todo, result.Error
}

func (r *todoRepository) UpdateTodo(ctx context.Context, todo *models.Todo) error {
	result := r.db.WithContext(ctx).Save(todo)
	return result.Error
}

func (r *todoRepository) DeleteTodo(ctx context.Context, id uint) error {
	result := r.db.WithContext(ctx).Delete(&models.Todo{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
