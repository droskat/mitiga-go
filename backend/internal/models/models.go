package models

import "time"

type User struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	Approved  bool      `json:"approved"`
	CreatedAt time.Time `json:"created_at"`
}

type PendingUser struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

type Nickname struct {
	ID       int64  `json:"id"`
	UserID   int64  `json:"user_id"`
	RealName string `json:"real_name"`
	Nickname string `json:"nickname"`
}

type Gossip struct {
	ID           int64     `json:"id"`
	AuthorID     int64     `json:"author_id"`
	AuthorName   string    `json:"author_name"`
	Title        string    `json:"title"`
	Content      string    `json:"content"`
	Score        int       `json:"score"`
	LikeCount    int       `json:"like_count"`
	DislikeCount int       `json:"dislike_count"`
	CommentCount int       `json:"comment_count"`
	Tags         []Tag     `json:"tags"`
	CreatedAt    time.Time `json:"created_at"`
	LikedByMe   bool      `json:"liked_by_me"`
	DislikedByMe bool     `json:"disliked_by_me"`
}

type ReactionUsers struct {
	LikedBy    []string `json:"liked_by"`
	DislikedBy []string `json:"disliked_by"`
}

type Tag struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type Comment struct {
	ID         int64     `json:"id"`
	GossipID   int64     `json:"gossip_id"`
	AuthorID   int64     `json:"author_id"`
	AuthorName string    `json:"author_name"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
}

type Like struct {
	ID       int64 `json:"id"`
	GossipID int64 `json:"gossip_id"`
	UserID   int64 `json:"user_id"`
}

type ScoreEntry struct {
	UserID   int64  `json:"user_id"`
	Username string `json:"username"`
	Score    int    `json:"score"`
	Posts    int    `json:"posts"`
	Likes    int    `json:"likes"`
	Dislikes int    `json:"dislikes"`
	Comments int    `json:"comments"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=30"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type CreateGossipRequest struct {
	Title   string   `json:"title" binding:"required,min=1,max=200"`
	Content string   `json:"content" binding:"required,min=1"`
	Tags    []string `json:"tags" binding:"required,min=1"`
}

type CreateCommentRequest struct {
	Content string `json:"content" binding:"required,min=1"`
}

type NicknameRequest struct {
	RealName string `json:"real_name" binding:"required"`
	Nickname string `json:"nickname" binding:"required"`
}
