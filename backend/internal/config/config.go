package config

import (
	"log"
	"time"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type Config struct {
	ServerPort           string        `mapstructure:"SERVER_PORT"`
	DBHost               string        `mapstructure:"DB_HOST"`
	DBPort               string        `mapstructure:"DB_PORT"`
	DBUser               string        `mapstructure:"DB_USER"`
	DBPassword           string        `mapstructure:"DB_PASSWORD"`
	DBName               string        `mapstructure:"DB_NAME"`
	DBSSLMode            string        `mapstructure:"DB_SSLMODE"`
	PgAdminEmail         string        `mapstructure:"PGADMIN_DEFAULT_EMAIL"`
	PgAdminPassword      string        `mapstructure:"PGADMIN_DEFAULT_PASSWORD"`
	JWTSecret            string        `mapstructure:"JWT_SECRET"`
	JWTExpiresInDuration time.Duration `mapstructure:"JWT_EXPIRES_IN_MINUTES"`
	CORSAllowedOrigins   string        `mapstructure:"CORS_ALLOWED_ORIGINS"`
}

var AppConfig *Config

func LoadConfig(path string) (*Config, error) {
	_ = godotenv.Load(path + "/.env")

	viper.AddConfigPath(path)
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	viper.AutomaticEnv()

	viper.SetDefault("SERVER_PORT", "8080")
	viper.SetDefault("DB_SSLMODE", "disable")
	viper.SetDefault("JWT_EXPIRES_IN_MINUTES", "60m")
	viper.SetDefault("CORS_ALLOWED_ORIGINS", "*")

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			log.Printf("Warning: Failed to read config file: %v. Relying on environment variables.", err)
		}
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	AppConfig = &cfg
	return &cfg, nil
}
