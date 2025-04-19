package handlers

import (
	"errors"
	"github.com/xNatthapol/todo-list/internal/models"
	"github.com/xNatthapol/todo-list/internal/services"
	"log"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService services.AuthService
	validate    *validator.Validate
}

func NewAuthHandler(authService services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		validate:    validator.New(),
	}
}

// RegisterRequest defines the request body for user registration
// @name RegisterRequest
type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// LoginRequest defines the request body for user login
// @name LoginRequest
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// AuthResponse defines the successful authentication response
// @name AuthResponse
type AuthResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

// Register handles user registration
// @Summary Register a new user
// @Description Creates a new user account.
// @Tags Auth
// @Accept json
// @Produce json
// @Param user body RegisterRequest true "User registration details"
// @Success 201 {object} models.User "User created successfully (excluding password)"
// @Failure 400 {object} ErrorResponse "Validation error or invalid input"
// @Failure 409 {object} ErrorResponse "User with this email already exists"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	req := new(RegisterRequest)

	if err := c.BodyParser(req); err != nil {
		log.Printf("Error parsing register request body: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Cannot parse JSON"})
	}

	if err := h.validate.Struct(req); err != nil {
		log.Printf("Validation error during registration: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Validation failed", Details: err.Error()})
	}

	user, err := h.authService.RegisterUser(c.Context(), req.Email, req.Password)
	if err != nil {
		log.Printf("Error registering user: %v", err)
		if errors.Is(err, services.ErrUserAlreadyExists) {
			return c.Status(fiber.StatusConflict).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to register user"})
	}

	return c.Status(fiber.StatusCreated).JSON(user)
}

// Login handles user login
// @Summary Log in a user
// @Description Authenticates a user and returns a JWT token.
// @Tags Auth
// @Accept json
// @Produce json
// @Param credentials body LoginRequest true "User login credentials"
// @Success 200 {object} AuthResponse "Login successful"
// @Failure 400 {object} ErrorResponse "Validation error or invalid input"
// @Failure 401 {object} ErrorResponse "Invalid credentials"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	req := new(LoginRequest)

	if err := c.BodyParser(req); err != nil {
		log.Printf("Error parsing login request body: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Cannot parse JSON"})
	}

	if err := h.validate.Struct(req); err != nil {
		log.Printf("Validation error during login: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Validation failed", Details: err.Error()})
	}

	token, user, err := h.authService.LoginUser(c.Context(), req.Email, req.Password)
	if err != nil {
		log.Printf("Error logging in user %s: %v", req.Email, err)
		if errors.Is(err, services.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to login user"})
	}

	return c.Status(fiber.StatusOK).JSON(AuthResponse{
		Token: token,
		User:  user,
	})
}

// ErrorResponse defines the standard error response format
// @name ErrorResponse
type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}
