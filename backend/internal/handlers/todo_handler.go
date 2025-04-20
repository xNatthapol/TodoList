package handlers

import (
	"errors"
	"github.com/xNatthapol/todo-list/internal/middleware"
	"github.com/xNatthapol/todo-list/internal/models"
	"github.com/xNatthapol/todo-list/internal/services"
	"log"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type TodoHandler struct {
	todoService services.TodoService
	validate    *validator.Validate
}

func NewTodoHandler(todoService services.TodoService) *TodoHandler {
	return &TodoHandler{
		todoService: todoService,
		validate:    validator.New(),
	}
}

// CreateTodo handles creation of a new todo item
// @Summary Create a new todo item
// @Description Adds a new todo item to the authenticated user's list.
// @Tags Todos
// @Accept json
// @Produce json
// @Param todo body models.CreateTodoRequest true "Todo details (title required, description optional)"
// @Security BearerAuth
// @Success 201 {object} models.Todo "Todo created successfully"
// @Failure 400 {object} ErrorResponse "Validation error or invalid input"
// @Failure 401 {object} ErrorResponse "Unauthorized (invalid/missing token)"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /todos [post]
func (h *TodoHandler) CreateTodo(c *fiber.Ctx) error {
	// Get user ID from middleware
	userID := c.Locals(middleware.UserIDKey).(uint)

	req := new(models.CreateTodoRequest)
	if err := c.BodyParser(req); err != nil {
		log.Printf("Error parsing create todo request body: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Cannot parse JSON"})
	}

	if err := h.validate.Struct(req); err != nil {
		log.Printf("Validation error during todo creation: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Validation failed", Details: err.Error()})
	}

	todo, err := h.todoService.CreateTodo(c.Context(), userID, req.Title, req.Description, req.ImageURL)
	if err != nil {
		log.Printf("Error creating todo for user %d: %v", userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to create todo"})
	}

	return c.Status(fiber.StatusCreated).JSON(todo)
}

// GetTodos retrieves all todo items for the authenticated user
// @Summary Get all todo items
// @Description Retrieves a list of all todo items for the logged-in user.
// @Tags Todos
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Todo "List of todo items"
// @Failure 401 {object} ErrorResponse "Unauthorized (invalid/missing token)"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /todos [get]
func (h *TodoHandler) GetTodos(c *fiber.Ctx) error {
	// Get user ID from middleware
	userID := c.Locals(middleware.UserIDKey).(uint)

	todos, err := h.todoService.GetTodosByUserID(c.Context(), userID)
	if err != nil {
		log.Printf("Error getting todos for user %d: %v", userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to retrieve todos"})
	}

	// Return empty list instead of null if no todos found
	if todos == nil {
		todos = []models.Todo{}
	}

	return c.Status(fiber.StatusOK).JSON(todos)
}

// GetTodo retrieves a specific todo item by ID
// @Summary Get a single todo item
// @Description Retrieves details of a specific todo item by its ID. Ensures the item belongs to the user.
// @Tags Todos
// @Produce json
// @Param id path int true "Todo ID"
// @Security BearerAuth
// @Success 200 {object} models.Todo "Todo item details"
// @Failure 400 {object} ErrorResponse "Invalid ID format"
// @Failure 401 {object} ErrorResponse "Unauthorized (invalid/missing token)"
// @Failure 403 {object} ErrorResponse "Forbidden (todo does not belong to user)"
// @Failure 404 {object} ErrorResponse "Todo not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /todos/{id} [get]
func (h *TodoHandler) GetTodo(c *fiber.Ctx) error {
	userID := c.Locals(middleware.UserIDKey).(uint)
	todoIDStr := c.Params("id")
	todoID, err := strconv.ParseUint(todoIDStr, 10, 32)
	if err != nil {
		log.Printf("Invalid todo ID format: %s", todoIDStr)
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Invalid todo ID format"})
	}

	todo, err := h.todoService.GetTodoByID(c.Context(), userID, uint(todoID))
	if err != nil {
		log.Printf("Error getting todo ID %d for user %d: %v", todoID, userID, err)
		if errors.Is(err, services.ErrTodoNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{Error: err.Error()})
		}
		if errors.Is(err, services.ErrForbidden) {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to retrieve todo"})
	}

	return c.Status(fiber.StatusOK).JSON(todo)
}

// UpdateTodo updates the content of a specific todo item
// @Summary Update todo item
// @Description Partially updates the content of a specific todo item. Only include fields to be updated.
// @Tags Todos
// @Accept json
// @Produce json
// @Param id path int true "Todo ID" Format(uint)
// @Param todo body models.UpdateTodoRequest true "Fields to update"
// @Security BearerAuth
// @Success 200 {object} models.Todo "Todo updated successfully"
// @Failure 400 {object} ErrorResponse "Invalid ID format, validation error, or no update fields provided"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Todo not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /todos/{id} [patch]
func (h *TodoHandler) UpdateTodo(c *fiber.Ctx) error {
	userID := c.Locals(middleware.UserIDKey).(uint)
	todoIDStr := c.Params("id")
	todoID, err := strconv.ParseUint(todoIDStr, 10, 32)
	if err != nil {
		log.Printf("Invalid todo ID format for update: %s", todoIDStr)
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Invalid todo ID format"})
	}

	req := new(models.UpdateTodoRequest)
	if err := c.BodyParser(req); err != nil {
		log.Printf("Error parsing update todo request body: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Cannot parse JSON"})
	}

	if err := h.validate.Struct(req); err != nil {
		log.Printf("Validation error during todo update: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Validation failed", Details: err.Error()})
	}

	updatedTodo, err := h.todoService.UpdateTodo(c.Context(), userID, uint(todoID), req.Title, req.Description, req.ImageURL)
	if err != nil {
		log.Printf("Error service UpdateTodo for todo ID %d, user %d: %v", todoID, userID, err)
		if errors.Is(err, services.ErrTodoNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{Error: err.Error()})
		}
		if errors.Is(err, services.ErrForbidden) {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{Error: err.Error()})
		}
		if errors.Is(err, services.ErrNoUpdateFieldsProvided) {
			return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to update todo"})
	}

	return c.Status(fiber.StatusOK).JSON(updatedTodo)
}

// UpdateTodoStatus updates the status of a specific todo item
// @Summary Update todo status
// @Description Updates the status (Pending, In Progress, Done) of a specific todo item.
// @Tags Todos
// @Accept json
// @Produce json
// @Param id path int true "Todo ID"
// @Param status body models.UpdateTodoStatusRequest true "New status"
// @Security BearerAuth
// @Success 200 {object} models.Todo "Todo updated successfully"
// @Failure 400 {object} ErrorResponse "Invalid ID format, validation error, or invalid input"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Todo not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /todos/{id}/status [put]
func (h *TodoHandler) UpdateTodoStatus(c *fiber.Ctx) error {
	userID := c.Locals(middleware.UserIDKey).(uint)
	todoIDStr := c.Params("id")
	todoID, err := strconv.ParseUint(todoIDStr, 10, 32)
	if err != nil {
		log.Printf("Invalid todo ID format: %s", todoIDStr)
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Invalid todo ID format"})
	}

	req := new(models.UpdateTodoStatusRequest)
	if err := c.BodyParser(req); err != nil {
		log.Printf("Error parsing update status request body: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Cannot parse JSON"})
	}

	if err := h.validate.Struct(req); err != nil {
		log.Printf("Validation error during status update: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Validation failed: Invalid status value", Details: err.Error()})
	}

	updatedTodo, err := h.todoService.UpdateTodoStatus(c.Context(), userID, uint(todoID), req.Status)
	if err != nil {
		log.Printf("Error updating status for todo ID %d, user %d: %v", todoID, userID, err)
		if errors.Is(err, services.ErrTodoNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{Error: err.Error()})
		}
		if errors.Is(err, services.ErrForbidden) {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to update todo status"})
	}

	return c.Status(fiber.StatusOK).JSON(updatedTodo)
}

// DeleteTodo removes a specific todo item
// @Summary Delete a todo item
// @Description Deletes a specific todo item by its ID.
// @Tags Todos
// @Produce json
// @Param id path int true "Todo ID"
// @Security BearerAuth
// @Success 204 "No Content (Todo deleted successfully)"
// @Failure 400 {object} ErrorResponse "Invalid ID format"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Todo not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /todos/{id} [delete]
func (h *TodoHandler) DeleteTodo(c *fiber.Ctx) error {
	userID := c.Locals(middleware.UserIDKey).(uint)
	todoIDStr := c.Params("id")
	todoID, err := strconv.ParseUint(todoIDStr, 10, 32)
	if err != nil {
		log.Printf("Invalid todo ID format: %s", todoIDStr)
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Invalid todo ID format"})
	}

	err = h.todoService.DeleteTodo(c.Context(), userID, uint(todoID))
	if err != nil {
		log.Printf("Error deleting todo ID %d for user %d: %v", todoID, userID, err)
		if errors.Is(err, services.ErrTodoNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{Error: err.Error()})
		}
		if errors.Is(err, services.ErrForbidden) {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to delete todo"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
