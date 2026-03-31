package middleware

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret []byte

type UserChecker interface {
	IsUserApproved(userID int64) (bool, error)
}

func Init() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "mitiga-go-super-secret-jwt-key-2024"
	}
	jwtSecret = []byte(secret)
}

func GenerateToken(userID int64, username string, approved bool) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  userID,
		"username": username,
		"approved": approved,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
			c.Abort()
			return
		}

		token, err := jwt.Parse(parts[1], func(t *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			c.Abort()
			return
		}

		userID := int64(claims["user_id"].(float64))
		username := claims["username"].(string)
		c.Set("user_id", userID)
		c.Set("username", username)
		c.Next()
	}
}

// ApprovedRequired checks the database in real-time to ensure the user is approved.
// This prevents stale JWT claims from granting access.
func ApprovedRequired(checker UserChecker) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt64("user_id")
		approved, err := checker.IsUserApproved(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check approval status"})
			c.Abort()
			return
		}
		if !approved {
			c.JSON(http.StatusForbidden, gin.H{"error": "account pending approval"})
			c.Abort()
			return
		}
		c.Next()
	}
}
