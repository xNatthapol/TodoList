package main

import (
	"log"

	"github.com/xNatthapol/todo-list/internal/config"
	"github.com/xNatthapol/todo-list/internal/database"
	"github.com/xNatthapol/todo-list/internal/handlers"
	"github.com/xNatthapol/todo-list/internal/repositories"
	"github.com/xNatthapol/todo-list/internal/services"

	_ "github.com/xNatthapol/todo-list/docs"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

// @title TodoList Application API
// @version 1.0
// @description This is a sample Todo list application API server.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /api
// @schemes http https
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.
func main() {
	cfg, err := config.LoadConfig(".")
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	db, err := database.ConnectDB(cfg)
	if err != nil {
		log.Fatalf("FATAL: Failed to initialize database: %v", err)
	}
	userRepo := repositories.NewUserRepository(db)
	todoRepo := repositories.NewTodoRepository(db)

	authService := services.NewAuthService(userRepo, cfg)
	todoService := services.NewTodoService(todoRepo)

	authHandler := handlers.NewAuthHandler(authService)
	todoHandler := handlers.NewTodoHandler(todoService)

	app := fiber.New(fiber.Config{
		AppName: "TodoList App",
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.CORSAllowedOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))
	app.Use(logger.New())

	handlers.SetupRoutes(app, authHandler, todoHandler, cfg)

	log.Printf("INFO: Starting server on port %s", cfg.ServerPort)
	if err := app.Listen(":" + cfg.ServerPort); err != nil {
		log.Fatalf("FATAL: Server failed to start: %v", err)
	}
}
