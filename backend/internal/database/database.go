package database

import (
	"fmt"
	"github.com/xNatthapol/todo-list/internal/config"
	"github.com/xNatthapol/todo-list/internal/models"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDB(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort, cfg.DBSSLMode, cfg.TimeZone)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to connect database: %w", err)
	}

	log.Println("Database connection established")

	// Run migrations
	log.Println("Running database migrations...")
	err = db.AutoMigrate(&models.User{}, &models.Todo{})
	if err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}
	log.Println("Database migrated successfully")

	// Assign to global variable
	DB = db

	return db, nil
}
