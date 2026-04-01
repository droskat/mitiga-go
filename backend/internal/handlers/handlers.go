package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"mitiga-go/internal/database"
	"mitiga-go/internal/middleware"
)

type Handler struct {
	db *database.DB
}

func New(db *database.DB) *Handler {
	return &Handler{db: db}
}

func (h *Handler) Register(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required,min=3,max=30"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	id, err := h.db.CreateUser(req.Username, req.Email, string(hashed))
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "username already taken"})
		return
	}

	// New users are not approved yet (approved=false)
	token, err := middleware.GenerateToken(id, req.Username, false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token":    token,
		"user_id":  id,
		"username": req.Username,
		"approved": false,
	})
}

func (h *Handler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.db.GetUserByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := middleware.GenerateToken(user.ID, user.Username, user.Approved)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":    token,
		"user_id":  user.ID,
		"username": user.Username,
		"approved": user.Approved,
	})
}

func (h *Handler) GetProfile(c *gin.Context) {
	userID := c.GetInt64("user_id")
	user, err := h.db.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// --- Approval management ---

func (h *Handler) GetPendingUsers(c *gin.Context) {
	users, err := h.db.GetPendingUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch pending users"})
		return
	}
	if users == nil {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *Handler) ApproveUser(c *gin.Context) {
	approverID := c.GetInt64("user_id")
	userID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}
	if err := h.db.ApproveUser(userID, approverID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "user approved"})
}

func (h *Handler) RejectUser(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}
	if err := h.db.RejectUser(userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "user rejected and removed"})
}

// --- Nicknames ---

func (h *Handler) UpsertNickname(c *gin.Context) {
	userID := c.GetInt64("user_id")
	var req struct {
		RealName string `json:"real_name" binding:"required"`
		Nickname string `json:"nickname" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.db.UpsertNickname(userID, req.RealName, req.Nickname); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save nickname"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "nickname saved"})
}

func (h *Handler) GetNicknames(c *gin.Context) {
	userID := c.GetInt64("user_id")
	nicknames, err := h.db.GetNicknames(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch nicknames"})
		return
	}
	if nicknames == nil {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}
	c.JSON(http.StatusOK, nicknames)
}

func (h *Handler) DeleteNickname(c *gin.Context) {
	userID := c.GetInt64("user_id")
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.db.DeleteNickname(id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete nickname"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "nickname deleted"})
}

func (h *Handler) GetNicknameMap(c *gin.Context) {
	m, err := h.db.GetNicknameMap()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch nickname map"})
		return
	}
	c.JSON(http.StatusOK, m)
}

// --- Tags ---

func (h *Handler) GetTags(c *gin.Context) {
	tags, err := h.db.GetAllTags()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tags"})
		return
	}
	if tags == nil {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}
	c.JSON(http.StatusOK, tags)
}

// --- Gossips ---

func (h *Handler) CreateGossip(c *gin.Context) {
	userID := c.GetInt64("user_id")
	var req struct {
		Title   string   `json:"title" binding:"required,min=1,max=200"`
		Content string   `json:"content" binding:"required,min=1"`
		Tags    []string `json:"tags" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	id, err := h.db.CreateGossip(userID, req.Title, req.Content, req.Tags)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create gossip"})
		return
	}
	gossip, err := h.db.GetGossipByID(id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve gossip"})
		return
	}
	c.JSON(http.StatusCreated, gossip)
}

func (h *Handler) GetGossips(c *gin.Context) {
	userID := c.GetInt64("user_id")
	tagFilter := c.Query("tag")
	gossips, err := h.db.GetGossips(userID, tagFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch gossips"})
		return
	}
	if gossips == nil {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}
	c.JSON(http.StatusOK, gossips)
}

func (h *Handler) GetGossip(c *gin.Context) {
	userID := c.GetInt64("user_id")
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	gossip, err := h.db.GetGossipByID(id, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "gossip not found"})
		return
	}
	c.JSON(http.StatusOK, gossip)
}

// --- Likes ---

func (h *Handler) ToggleLike(c *gin.Context) {
	userID := c.GetInt64("user_id")
	gossipID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	liked, err := h.db.ToggleLike(gossipID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to toggle like"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"liked": liked})
}

func (h *Handler) ToggleDislike(c *gin.Context) {
	userID := c.GetInt64("user_id")
	gossipID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	disliked, err := h.db.ToggleDislike(gossipID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to toggle dislike"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"disliked": disliked})
}

func (h *Handler) GetReactionUsers(c *gin.Context) {
	gossipID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	reactions, err := h.db.GetReactionUsers(gossipID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch reactions"})
		return
	}
	c.JSON(http.StatusOK, reactions)
}

// --- Comments ---

func (h *Handler) CreateComment(c *gin.Context) {
	userID := c.GetInt64("user_id")
	gossipID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req struct {
		Content string `json:"content" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	commentID, err := h.db.CreateComment(gossipID, userID, req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create comment"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": commentID})
}

func (h *Handler) GetComments(c *gin.Context) {
	gossipID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	comments, err := h.db.GetComments(gossipID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch comments"})
		return
	}
	if comments == nil {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}
	c.JSON(http.StatusOK, comments)
}

// --- Scoreboard ---

func (h *Handler) GetScoreboard(c *gin.Context) {
	entries, err := h.db.GetScoreboard()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch scoreboard"})
		return
	}
	if entries == nil {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}
	c.JSON(http.StatusOK, entries)
}
