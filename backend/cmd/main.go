package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"mitiga-go/internal/crypto"
	"mitiga-go/internal/database"
	"mitiga-go/internal/handlers"
	"mitiga-go/internal/middleware"
)

func main() {
	if err := crypto.Init(); err != nil {
		log.Fatal("Failed to init encryption:", err)
	}
	middleware.Init()

	dbUser := configVal("DB_USER")
	dbPass := configVal("DB_PASS")
	dbHost := configVal("DB_HOST")
	dbPort := configVal("DB_PORT")
	dbName := configVal("DB_NAME")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=UTC",
		dbUser, dbPass, dbHost, dbPort, dbName,
	)
	db, err := database.New(dsn)
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}
	defer db.Close()
	log.Printf("Connected to MySQL at %s:%s/%s", dbHost, dbPort, dbName)

	h := handlers.New(db)
	r := gin.Default()

	allowedOrigins := []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"}
	if extra := os.Getenv("CORS_ORIGINS"); extra != "" {
		for _, o := range strings.Split(extra, ",") {
			allowedOrigins = append(allowedOrigins, strings.TrimSpace(o))
		}
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")
	{
		api.POST("/register", h.Register)
		api.POST("/login", h.Login)

		// Routes that require login but NOT approval (so pending users can check status)
		auth := api.Group("")
		auth.Use(middleware.AuthRequired())
		{
			auth.GET("/profile", h.GetProfile)
		}

		// Routes that require login AND approval
		approved := api.Group("")
		approved.Use(middleware.AuthRequired(), middleware.ApprovedRequired(db))
		{
			approved.GET("/tags", h.GetTags)

			approved.POST("/nicknames", h.UpsertNickname)
			approved.GET("/nicknames", h.GetNicknames)
			approved.DELETE("/nicknames/:id", h.DeleteNickname)
			approved.GET("/nickname-map", h.GetNicknameMap)

			approved.POST("/gossips", h.CreateGossip)
			approved.GET("/gossips", h.GetGossips)
			approved.GET("/gossips/:id", h.GetGossip)

			approved.POST("/gossips/:id/like", h.ToggleLike)
			approved.POST("/gossips/:id/dislike", h.ToggleDislike)
			approved.GET("/gossips/:id/reactions", h.GetReactionUsers)
			approved.POST("/gossips/:id/comments", h.CreateComment)
			approved.GET("/gossips/:id/comments", h.GetComments)

			approved.GET("/scoreboard", h.GetScoreboard)

			approved.GET("/pending-users", h.GetPendingUsers)
			approved.POST("/approve/:id", h.ApproveUser)
			approved.POST("/reject/:id", h.RejectUser)
		}
	}

	port := envOrDefault("PORT", "8091")
	log.Printf("Server starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func configVal(key string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	if val, ok := dbDefaults[key]; ok {
		return val
	}
	return ""
}

func envOrDefault(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
