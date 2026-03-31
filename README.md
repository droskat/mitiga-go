# Mitiga Go — Office Grapevine Tracker

A full-stack application for tracking office gossip, rumours, and news with encrypted storage, scoring, tagging, and nickname management.

## Features

- **Authentication** — Register/login with JWT-based sessions
- **Encrypted Storage** — All sensitive content (gossip titles, content, comments, emails, nicknames) encrypted with AES-256-GCM in the database. No raw data stored.
- **Gossip Feed** — Publish gossips with title, content, and tags
- **Tags** — Built-in tags (rumour, gossip, news, fun, exit) + create your own custom tags
- **Filter by Tag** — Click a tag to filter the feed
- **Likes** — Toggle likes on gossips
- **Comments** — Comment on gossips
- **Scoring** — Relevance score = Likes×3 + Comments×2
- **Scoreboard** — Leaderboard ranking users by Posts×5 + Likes×3 + Comments×2
- **Nickname Manager** — Map nicknames to real names. Use nicknames in gossips — the frontend resolves them to real names for display.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Go, Gin, SQLite |
| Frontend | React 18, Vite, React Router, Lucide Icons |
| Auth | JWT (HS256), bcrypt password hashing |
| Encryption | AES-256-GCM (all DB content encrypted) |

## Prerequisites

- Go 1.22+
- Node.js 18+ / npm

## Quick Start

### 1. Backend

```bash
cd backend
go mod tidy
go run cmd/main.go
```

The API server starts on `http://localhost:8080`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173` and proxies API calls to the backend.

### 3. Open the App

Navigate to [http://localhost:5173](http://localhost:5173), register a new account, and start sharing!

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENCRYPTION_KEY` | built-in 32-byte key | AES-256 encryption key (must be exactly 32 bytes) |
| `JWT_SECRET` | built-in secret | JWT signing secret |
| `DB_PATH` | `./mitiga.db` | Path to SQLite database file |
| `PORT` | `8080` | Backend server port |

## Project Structure

```
mitiga-go/
├── backend/
│   ├── cmd/main.go                    # Entry point
│   └── internal/
│       ├── crypto/crypto.go           # AES-256-GCM encrypt/decrypt
│       ├── database/database.go       # SQLite + encrypted CRUD
│       ├── handlers/handlers.go       # HTTP route handlers
│       ├── middleware/auth.go         # JWT auth middleware
│       └── models/models.go          # Data models
└── frontend/
    └── src/
        ├── components/                # Reusable components
        ├── context/AuthContext.jsx     # Auth state management
        ├── hooks/useApi.js            # API client
        └── pages/                     # Route pages
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/register` | No | Register new user |
| POST | `/api/login` | No | Login |
| GET | `/api/profile` | Yes | Get current user |
| GET | `/api/tags` | Yes | List all tags |
| POST | `/api/gossips` | Yes | Create gossip |
| GET | `/api/gossips` | Yes | List gossips (optional `?tag=` filter) |
| GET | `/api/gossips/:id` | Yes | Get single gossip |
| POST | `/api/gossips/:id/like` | Yes | Toggle like |
| POST | `/api/gossips/:id/comments` | Yes | Add comment |
| GET | `/api/gossips/:id/comments` | Yes | List comments |
| POST | `/api/nicknames` | Yes | Create/update nickname |
| GET | `/api/nicknames` | Yes | List user's nicknames |
| DELETE | `/api/nicknames/:id` | Yes | Delete nickname |
| GET | `/api/nickname-map` | Yes | Get all nickname→real name mappings |
| GET | `/api/scoreboard` | Yes | Get scoreboard rankings |
