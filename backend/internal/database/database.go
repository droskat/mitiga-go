package database

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"mitiga-go/internal/crypto"
	"mitiga-go/internal/models"
)

type DB struct {
	conn *sql.DB
}

func New(dsn string) (*DB, error) {
	conn, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	if err := conn.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
	conn.SetMaxOpenConns(25)
	conn.SetMaxIdleConns(5)
	conn.SetConnMaxLifetime(5 * time.Minute)

	db := &DB{conn: conn}
	if err := db.migrate(); err != nil {
		return nil, err
	}
	return db, nil
}

func (db *DB) Close() error {
	return db.conn.Close()
}

func (db *DB) migrate() error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS mitigausers (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			username VARCHAR(100) NOT NULL UNIQUE,
			email TEXT NOT NULL,
			password VARCHAR(255) NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS nicknames (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			user_id BIGINT NOT NULL,
			real_name TEXT NOT NULL,
			nickname TEXT NOT NULL,
			FOREIGN KEY (user_id) REFERENCES mitigausers(id)
		)`,
		`CREATE TABLE IF NOT EXISTS gossips (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			author_id BIGINT NOT NULL,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (author_id) REFERENCES mitigausers(id)
		)`,
		`CREATE TABLE IF NOT EXISTS tags (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(100) NOT NULL UNIQUE
		)`,
		`CREATE TABLE IF NOT EXISTS gossip_tags (
			gossip_id BIGINT NOT NULL,
			tag_id BIGINT NOT NULL,
			PRIMARY KEY (gossip_id, tag_id),
			FOREIGN KEY (gossip_id) REFERENCES gossips(id) ON DELETE CASCADE,
			FOREIGN KEY (tag_id) REFERENCES tags(id)
		)`,
		`CREATE TABLE IF NOT EXISTS comments (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			gossip_id BIGINT NOT NULL,
			author_id BIGINT NOT NULL,
			content TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (gossip_id) REFERENCES gossips(id) ON DELETE CASCADE,
			FOREIGN KEY (author_id) REFERENCES mitigausers(id)
		)`,
		`CREATE TABLE IF NOT EXISTS likes (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			gossip_id BIGINT NOT NULL,
			user_id BIGINT NOT NULL,
			UNIQUE KEY uq_gossip_user (gossip_id, user_id),
			FOREIGN KEY (gossip_id) REFERENCES gossips(id) ON DELETE CASCADE,
			FOREIGN KEY (user_id) REFERENCES mitigausers(id)
		)`,
	}
	for _, stmt := range statements {
		if _, err := db.conn.Exec(stmt); err != nil {
			return fmt.Errorf("migration failed: %s: %w", stmt, err)
		}
	}

	// Add approved column if it doesn't exist (safe migration for existing tables)
	db.conn.Exec("ALTER TABLE mitigausers ADD COLUMN approved TINYINT NOT NULL DEFAULT 0")
	db.conn.Exec("ALTER TABLE mitigausers ADD COLUMN approved_by BIGINT DEFAULT NULL")

	seedTags := []string{"rumour", "gossip", "news", "fun", "exit"}
	for _, tag := range seedTags {
		db.conn.Exec("INSERT IGNORE INTO tags (name) VALUES (?)", tag)
	}

	// Auto-approve the very first user so the system is bootstrappable
	var count int
	db.conn.QueryRow("SELECT COUNT(*) FROM mitigausers").Scan(&count)
	if count > 0 {
		db.conn.Exec("UPDATE mitigausers SET approved = 1 WHERE id = (SELECT min_id FROM (SELECT MIN(id) AS min_id FROM mitigausers) AS t) AND approved = 0 AND (SELECT COUNT(*) FROM mitigausers WHERE approved = 1) = 0")
	}

	return nil
}

// --- User operations ---

func (db *DB) CreateUser(username, email, hashedPassword string) (int64, error) {
	encEmail, err := crypto.Encrypt(email)
	if err != nil {
		return 0, err
	}
	res, err := db.conn.Exec(
		"INSERT INTO mitigausers (username, email, password, approved) VALUES (?, ?, ?, 0)",
		username, encEmail, hashedPassword,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (db *DB) GetUserByUsername(username string) (*models.User, error) {
	var u models.User
	var encEmail string
	err := db.conn.QueryRow(
		"SELECT id, username, email, password, approved, created_at FROM mitigausers WHERE username = ?", username,
	).Scan(&u.ID, &u.Username, &encEmail, &u.Password, &u.Approved, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	u.Email, _ = crypto.Decrypt(encEmail)
	return &u, nil
}

func (db *DB) GetUserByID(id int64) (*models.User, error) {
	var u models.User
	var encEmail string
	err := db.conn.QueryRow(
		"SELECT id, username, email, approved, created_at FROM mitigausers WHERE id = ?", id,
	).Scan(&u.ID, &u.Username, &encEmail, &u.Approved, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	u.Email, _ = crypto.Decrypt(encEmail)
	return &u, nil
}

func (db *DB) IsUserApproved(userID int64) (bool, error) {
	var approved bool
	err := db.conn.QueryRow("SELECT approved FROM mitigausers WHERE id = ?", userID).Scan(&approved)
	return approved, err
}

func (db *DB) GetPendingUsers() ([]models.PendingUser, error) {
	rows, err := db.conn.Query(
		"SELECT id, username, email, created_at FROM mitigausers WHERE approved = 0 ORDER BY created_at ASC",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var users []models.PendingUser
	for rows.Next() {
		var u models.PendingUser
		var encEmail string
		if err := rows.Scan(&u.ID, &u.Username, &encEmail, &u.CreatedAt); err != nil {
			return nil, err
		}
		u.Email, _ = crypto.Decrypt(encEmail)
		users = append(users, u)
	}
	return users, nil
}

func (db *DB) ApproveUser(userID, approvedByID int64) error {
	res, err := db.conn.Exec(
		"UPDATE mitigausers SET approved = 1, approved_by = ? WHERE id = ? AND approved = 0",
		approvedByID, userID,
	)
	if err != nil {
		return err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("user not found or already approved")
	}
	return nil
}

func (db *DB) RejectUser(userID int64) error {
	res, err := db.conn.Exec("DELETE FROM mitigausers WHERE id = ? AND approved = 0", userID)
	if err != nil {
		return err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("user not found or already approved")
	}
	return nil
}

// --- Nickname operations ---

func (db *DB) UpsertNickname(userID int64, realName, nickname string) error {
	encReal, err := crypto.Encrypt(realName)
	if err != nil {
		return err
	}
	encNick, err := crypto.Encrypt(nickname)
	if err != nil {
		return err
	}
	var id int64
	err = db.conn.QueryRow(
		"SELECT id FROM nicknames WHERE user_id = ? AND real_name = ?", userID, encReal,
	).Scan(&id)
	if err == sql.ErrNoRows {
		_, err = db.conn.Exec(
			"INSERT INTO nicknames (user_id, real_name, nickname) VALUES (?, ?, ?)",
			userID, encReal, encNick,
		)
		return err
	}
	if err != nil {
		return err
	}
	_, err = db.conn.Exec("UPDATE nicknames SET nickname = ? WHERE id = ?", encNick, id)
	return err
}

func (db *DB) GetNicknames(userID int64) ([]models.Nickname, error) {
	rows, err := db.conn.Query(
		"SELECT id, user_id, real_name, nickname FROM nicknames WHERE user_id = ?", userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var nicknames []models.Nickname
	for rows.Next() {
		var n models.Nickname
		var encReal, encNick string
		if err := rows.Scan(&n.ID, &n.UserID, &encReal, &encNick); err != nil {
			return nil, err
		}
		n.RealName, _ = crypto.Decrypt(encReal)
		n.Nickname, _ = crypto.Decrypt(encNick)
		nicknames = append(nicknames, n)
	}
	return nicknames, nil
}

func (db *DB) GetAllNicknames() (map[string]string, error) {
	rows, err := db.conn.Query("SELECT real_name, nickname FROM nicknames")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	m := make(map[string]string)
	for rows.Next() {
		var encReal, encNick string
		if err := rows.Scan(&encReal, &encNick); err != nil {
			continue
		}
		real, _ := crypto.Decrypt(encReal)
		nick, _ := crypto.Decrypt(encNick)
		if real != "" && nick != "" {
			m[nick] = real
		}
	}
	return m, nil
}

func (db *DB) DeleteNickname(id, userID int64) error {
	_, err := db.conn.Exec("DELETE FROM nicknames WHERE id = ? AND user_id = ?", id, userID)
	return err
}

// --- Tag operations ---

func (db *DB) GetOrCreateTag(name string) (int64, error) {
	var id int64
	err := db.conn.QueryRow("SELECT id FROM tags WHERE name = ?", name).Scan(&id)
	if err == sql.ErrNoRows {
		res, err := db.conn.Exec("INSERT INTO tags (name) VALUES (?)", name)
		if err != nil {
			return 0, err
		}
		return res.LastInsertId()
	}
	return id, err
}

func (db *DB) GetAllTags() ([]models.Tag, error) {
	rows, err := db.conn.Query("SELECT id, name FROM tags ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var tags []models.Tag
	for rows.Next() {
		var t models.Tag
		if err := rows.Scan(&t.ID, &t.Name); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	return tags, nil
}

// --- Gossip operations ---

func (db *DB) CreateGossip(authorID int64, title, content string, tagNames []string) (int64, error) {
	encTitle, err := crypto.Encrypt(title)
	if err != nil {
		return 0, err
	}
	encContent, err := crypto.Encrypt(content)
	if err != nil {
		return 0, err
	}

	tx, err := db.conn.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	res, err := tx.Exec(
		"INSERT INTO gossips (author_id, title, content) VALUES (?, ?, ?)",
		authorID, encTitle, encContent,
	)
	if err != nil {
		return 0, err
	}
	gossipID, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	for _, tagName := range tagNames {
		tagID, err := db.GetOrCreateTag(tagName)
		if err != nil {
			return 0, err
		}
		if _, err := tx.Exec(
			"INSERT IGNORE INTO gossip_tags (gossip_id, tag_id) VALUES (?, ?)",
			gossipID, tagID,
		); err != nil {
			return 0, err
		}
	}

	return gossipID, tx.Commit()
}

func (db *DB) GetGossips(currentUserID int64, tagFilter string) ([]models.Gossip, error) {
	query := `
		SELECT g.id, g.author_id, u.username, g.title, g.content, g.created_at,
			(SELECT COUNT(*) FROM likes WHERE gossip_id = g.id) as like_count,
			(SELECT COUNT(*) FROM comments WHERE gossip_id = g.id) as comment_count,
			(SELECT COUNT(*) FROM likes WHERE gossip_id = g.id AND user_id = ?) as liked_by_me
		FROM gossips g
		JOIN mitigausers u ON g.author_id = u.id
	`
	args := []interface{}{currentUserID}

	if tagFilter != "" {
		query += `
			JOIN gossip_tags gt ON g.id = gt.gossip_id
			JOIN tags t ON gt.tag_id = t.id
			WHERE t.name = ?
		`
		args = append(args, tagFilter)
	}
	query += " ORDER BY g.created_at DESC"

	rows, err := db.conn.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var gossips []models.Gossip
	for rows.Next() {
		var g models.Gossip
		var encTitle, encContent string
		var likedByMe int
		if err := rows.Scan(&g.ID, &g.AuthorID, &g.AuthorName, &encTitle, &encContent,
			&g.CreatedAt, &g.LikeCount, &g.CommentCount, &likedByMe); err != nil {
			return nil, err
		}
		g.Title, _ = crypto.Decrypt(encTitle)
		g.Content, _ = crypto.Decrypt(encContent)
		g.LikedByMe = likedByMe > 0
		g.Score = g.LikeCount*3 + g.CommentCount*2

		tags, err := db.GetGossipTags(g.ID)
		if err != nil {
			return nil, err
		}
		g.Tags = tags
		gossips = append(gossips, g)
	}
	return gossips, nil
}

func (db *DB) GetGossipByID(gossipID, currentUserID int64) (*models.Gossip, error) {
	var g models.Gossip
	var encTitle, encContent string
	var likedByMe int
	err := db.conn.QueryRow(`
		SELECT g.id, g.author_id, u.username, g.title, g.content, g.created_at,
			(SELECT COUNT(*) FROM likes WHERE gossip_id = g.id) as like_count,
			(SELECT COUNT(*) FROM comments WHERE gossip_id = g.id) as comment_count,
			(SELECT COUNT(*) FROM likes WHERE gossip_id = g.id AND user_id = ?) as liked_by_me
		FROM gossips g
		JOIN mitigausers u ON g.author_id = u.id
		WHERE g.id = ?
	`, currentUserID, gossipID).Scan(
		&g.ID, &g.AuthorID, &g.AuthorName, &encTitle, &encContent,
		&g.CreatedAt, &g.LikeCount, &g.CommentCount, &likedByMe,
	)
	if err != nil {
		return nil, err
	}
	g.Title, _ = crypto.Decrypt(encTitle)
	g.Content, _ = crypto.Decrypt(encContent)
	g.LikedByMe = likedByMe > 0
	g.Score = g.LikeCount*3 + g.CommentCount*2

	tags, err := db.GetGossipTags(g.ID)
	if err != nil {
		return nil, err
	}
	g.Tags = tags
	return &g, nil
}

func (db *DB) GetGossipTags(gossipID int64) ([]models.Tag, error) {
	rows, err := db.conn.Query(`
		SELECT t.id, t.name FROM tags t
		JOIN gossip_tags gt ON t.id = gt.tag_id
		WHERE gt.gossip_id = ?
	`, gossipID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var tags []models.Tag
	for rows.Next() {
		var t models.Tag
		if err := rows.Scan(&t.ID, &t.Name); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	return tags, nil
}

// --- Like operations ---

func (db *DB) ToggleLike(gossipID, userID int64) (bool, error) {
	var id int64
	err := db.conn.QueryRow(
		"SELECT id FROM likes WHERE gossip_id = ? AND user_id = ?", gossipID, userID,
	).Scan(&id)
	if err == sql.ErrNoRows {
		_, err = db.conn.Exec(
			"INSERT INTO likes (gossip_id, user_id) VALUES (?, ?)", gossipID, userID,
		)
		return true, err
	}
	if err != nil {
		return false, err
	}
	_, err = db.conn.Exec("DELETE FROM likes WHERE id = ?", id)
	return false, err
}

// --- Comment operations ---

func (db *DB) CreateComment(gossipID, authorID int64, content string) (int64, error) {
	encContent, err := crypto.Encrypt(content)
	if err != nil {
		return 0, err
	}
	res, err := db.conn.Exec(
		"INSERT INTO comments (gossip_id, author_id, content) VALUES (?, ?, ?)",
		gossipID, authorID, encContent,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (db *DB) GetComments(gossipID int64) ([]models.Comment, error) {
	rows, err := db.conn.Query(`
		SELECT c.id, c.gossip_id, c.author_id, u.username, c.content, c.created_at
		FROM comments c
		JOIN mitigausers u ON c.author_id = u.id
		WHERE c.gossip_id = ?
		ORDER BY c.created_at ASC
	`, gossipID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var comments []models.Comment
	for rows.Next() {
		var c models.Comment
		var encContent string
		if err := rows.Scan(&c.ID, &c.GossipID, &c.AuthorID, &c.AuthorName, &encContent, &c.CreatedAt); err != nil {
			return nil, err
		}
		c.Content, _ = crypto.Decrypt(encContent)
		comments = append(comments, c)
	}
	return comments, nil
}

// --- Scoreboard ---

func (db *DB) GetScoreboard() ([]models.ScoreEntry, error) {
	rows, err := db.conn.Query(`
		SELECT u.id, u.username,
			(SELECT COUNT(*) FROM gossips WHERE author_id = u.id) as posts,
			(SELECT COUNT(*) FROM likes l JOIN gossips g ON l.gossip_id = g.id WHERE g.author_id = u.id) as likes_received,
			(SELECT COUNT(*) FROM comments WHERE author_id = u.id) as comments_made
		FROM mitigausers u
		WHERE u.approved = 1
		ORDER BY (
			(SELECT COUNT(*) FROM gossips WHERE author_id = u.id) * 5 +
			(SELECT COUNT(*) FROM likes l JOIN gossips g ON l.gossip_id = g.id WHERE g.author_id = u.id) * 3 +
			(SELECT COUNT(*) FROM comments WHERE author_id = u.id) * 2
		) DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var entries []models.ScoreEntry
	for rows.Next() {
		var e models.ScoreEntry
		if err := rows.Scan(&e.UserID, &e.Username, &e.Posts, &e.Likes, &e.Comments); err != nil {
			return nil, err
		}
		e.Score = e.Posts*5 + e.Likes*3 + e.Comments*2
		entries = append(entries, e)
	}
	return entries, nil
}

// --- Nickname resolver for frontend display ---

func (db *DB) ResolveNicknames(text string) string {
	nickMap, err := db.GetAllNicknames()
	if err != nil {
		return text
	}
	result := text
	for nick, real := range nickMap {
		result = replaceAll(result, nick, real)
	}
	return result
}

func replaceAll(s, old, new string) string {
	if old == "" {
		return s
	}
	result := ""
	for {
		i := indexOf(s, old)
		if i < 0 {
			return result + s
		}
		result += s[:i] + new
		s = s[i+len(old):]
	}
}

func indexOf(s, sub string) int {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}

func (db *DB) GetNicknameMap() (map[string]string, error) {
	return db.GetAllNicknames()
}

func (db *DB) GetGossipCreatedAt(gossipID int64) (time.Time, error) {
	var t time.Time
	err := db.conn.QueryRow("SELECT created_at FROM gossips WHERE id = ?", gossipID).Scan(&t)
	return t, err
}
