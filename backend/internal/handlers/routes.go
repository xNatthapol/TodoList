package handlers

import (
	"github.com/xNatthapol/todo-list/internal/config"
	"github.com/xNatthapol/todo-list/internal/middleware"

	_ "github.com/xNatthapol/todo-list/docs"

	fiberSwagger "github.com/swaggo/fiber-swagger"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, authHandler *AuthHandler, todoHandler *TodoHandler, uploadHandler *UploadHandler, cfg *config.Config) {
	// Swagger Documentation Route
	app.Get("/swagger/*", fiberSwagger.WrapHandler)

	api := app.Group("/api")

	// Auth Routes
	auth := api.Group("/auth")
	auth.Post("/signup", authHandler.SignUp)
	auth.Post("/login", authHandler.Login)

	// Todo Routes
	todo := api.Group("/todos", middleware.Protected(cfg))
	todo.Post("/", todoHandler.CreateTodo)
	todo.Get("/", todoHandler.GetTodos)
	todo.Get("/:id", todoHandler.GetTodo)
	todo.Patch("/:id", todoHandler.UpdateTodo)
	todo.Put("/:id/status", todoHandler.UpdateTodoStatus)
	todo.Delete("/:id", todoHandler.DeleteTodo)

	// Upload Route
	uploads := api.Group("/uploads", middleware.Protected(cfg))
	uploads.Post("/images", uploadHandler.UploadImage)
}
