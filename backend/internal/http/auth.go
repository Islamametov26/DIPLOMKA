package httpapi

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/google/uuid"
	"islamdiplom/internal/domain"
	"islamdiplom/internal/repository"
	"islamdiplom/internal/service"
)

type AuthHandler struct {
	service *service.AuthService
}

type authResponse struct {
	Token string      `json:"token"`
	User  domain.User `json:"user"`
}

type authRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func NewAuthHandler(service *service.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var payload authRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, http.StatusBadRequest, "invalid payload")
		return
	}

	user, token, err := h.service.Register(c.Request.Context(), payload.Email, payload.Password)
	if err != nil {
		writeAuthError(c, err)
		return
	}

	c.JSON(http.StatusCreated, authResponse{Token: token, User: user})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var payload authRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, http.StatusBadRequest, "invalid payload")
		return
	}

	user, token, err := h.service.Login(c.Request.Context(), payload.Email, payload.Password)
	if err != nil {
		writeAuthError(c, err)
		return
	}

	c.JSON(http.StatusOK, authResponse{Token: token, User: user})
}

func (h *AuthHandler) Profile(c *gin.Context) {
	userID := c.GetString("user_id")
	id, err := uuid.Parse(userID)
	if err != nil {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := h.service.GetUser(c.Request.Context(), id)
	if err != nil {
		writeAuthError(c, err)
		return
	}

	c.JSON(http.StatusOK, user)
}

func authMiddleware(service *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		token := ""
		if header != "" {
			parts := strings.SplitN(header, " ", 2)
			if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
				token = parts[1]
			}
		}
		if token == "" {
			token = c.GetHeader("X-Auth-Token")
		}
		if token == "" {
			writeError(c, http.StatusUnauthorized, "unauthorized")
			c.Abort()
			return
		}

		userID, err := service.ParseToken(token)
		if err != nil {
			writeAuthError(c, err)
			c.Abort()
			return
		}

		c.Set("user_id", userID.String())
		c.Next()
	}
}

func writeAuthError(c *gin.Context, err error) {
	switch {
	case err == repository.ErrUnauthorized:
		writeError(c, http.StatusUnauthorized, "unauthorized")
	case err == repository.ErrConflict:
		writeError(c, http.StatusConflict, "conflict")
	case err == repository.ErrNotFound:
		writeError(c, http.StatusNotFound, "not found")
	default:
		writeError(c, http.StatusInternalServerError, "internal error")
	}
}
