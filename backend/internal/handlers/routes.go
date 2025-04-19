package handlers

import (
	"github.com/xNatthapol/todo-list/internal/config"
	"github.com/xNatthapol/todo-list/internal/middleware"

	_ "github.com/xNatthapol/todo-list/docs"

	fiberSwagger "github.com/swaggo/fiber-swagger"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, authHandler *AuthHandler, todoHandler *TodoHandler, cfg *config.Config) {
	// Swagger Documentation Route
	app.Get("/swagger/*", fiberSwagger.WrapHandler)

	api := app.Group("/api")

	// Auth Routes
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)

	// Todo Routes
	todo := api.Group("/todos", middleware.Protected(cfg))
	todo.Post("/", todoHandler.CreateTodo)
	todo.Get("/", todoHandler.GetTodos)
	todo.Get("/:id", todoHandler.GetTodo)
	todo.Put("/:id/status", todoHandler.UpdateTodoStatus)
	todo.Delete("/:id", todoHandler.DeleteTodo)

	// Upload Route
	// upload := api.Group("/upload", middleware.Protected(cfg))
	// upload.Post("/image", uploadHandler.UploadImage)
}
