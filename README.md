# Mitiga Go — Office Grapevine Tracker

A full-stack application for tracking office gossip, rumours, and news with encrypted storage, scoring, tagging, nickname management, and user approval workflows.

## Features

- **Authentication** — Register/login with JWT-based sessions
- **User Approval** — New users need approval from an existing member before accessing content
- **Encrypted Storage** — All sensitive content (gossip titles, content, comments, emails, nicknames) encrypted with AES-256-GCM in the database. No raw data stored.
- **Gossip Feed** — Publish gossips with title, content, and tags
- **Tags** — Built-in tags (rumour, gossip, news, fun, exit) + create your own custom tags
- **Filter by Tag** — Click a tag to filter the feed
- **Likes & Comments** — Interact with gossips
- **Scoring** — Relevance score = Likes×3 + Comments×2
- **Scoreboard** — Leaderboard ranking users by Posts×5 + Likes×3 + Comments×2
- **Nickname Manager** — Map nicknames to real names; the frontend resolves them for display
- **Responsive UI** — Works across desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Go 1.22, Gin, MySQL |
| Frontend | React 18, Vite, React Router, Lucide Icons |
| Auth | JWT (HS256), bcrypt password hashing |
| Encryption | AES-256-GCM (all DB content encrypted) |
| Deployment | Docker, Docker Compose, nginx |

## Prerequisites

- Go 1.22+
- Node.js 18+ / npm
- MySQL 8.0+ (or access to an RDS instance)
- Docker & Docker Compose (for containerised deployment)

---

## Local Development

### 1. Backend

Create `backend/cmd/config.go` with your DB credentials:

```go
package main

var dbDefaults = map[string]string{
    "DB_USER": "your_user",
    "DB_PASS": "your_password",
    "DB_HOST": "your_host",
    "DB_PORT": "3306",
    "DB_NAME": "your_db",
}
```

Then run:

```bash
cd backend
go mod tidy
go run ./cmd/
```

The API server starts on `http://localhost:8091`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173` and proxies `/api` calls to the backend.

### 3. Open the App

Navigate to [http://localhost:5173](http://localhost:5173), register a new account, and start sharing! The first registered user is auto-approved.

---

## Docker Deployment

### 1. Create your `.env` file

```bash
cp .env.example .env
# Edit .env with your actual database credentials and secrets
```

The `.env` file should contain:

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_USER` | Yes | MySQL username |
| `DB_PASS` | Yes | MySQL password |
| `DB_HOST` | Yes | MySQL host (e.g. your RDS endpoint) |
| `DB_PORT` | No | MySQL port (default: `3306`) |
| `DB_NAME` | No | Database name (default: `Test`) |
| `BACKEND_PORT` | No | Backend server port (default: `8091`) |
| `FRONTEND_PORT` | No | Frontend port on host (default: `80`) |
| `ENCRYPTION_KEY` | No | AES-256 key, exactly 32 bytes (has a built-in default) |
| `JWT_SECRET` | No | JWT signing secret (has a built-in default) |
| `CORS_ORIGINS` | No | Extra allowed origins, comma-separated |

### 2. Build and start

```bash
docker compose up -d --build
```

This builds both containers:
- **backend** — Go binary in a minimal Alpine image, exposed on port `8091`
- **frontend** — Vite production build served by nginx on port `80`, with `/api` reverse-proxied to the backend

### 3. Access the app

Open `http://<your-server-ip>` in a browser.

### Useful commands

```bash
# View logs
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend

# Restart after config changes
docker compose down && docker compose up -d --build

# Stop everything
docker compose down
```

---

## Deploying to a Cloud VM (EC2, Droplet, etc.)

### Step-by-step

1. **SSH into your server** and install Docker:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   # log out and back in, then:
   docker --version
   ```

2. **Clone the repo**:
   ```bash
   git clone https://github.com/droskat/mitiga-go.git
   cd mitiga-go
   ```

3. **Create `.env`** with your production credentials:
   ```bash
   cp .env.example .env
   nano .env
   ```

4. **Ensure your MySQL is reachable** from the VM (check VPN / security groups / firewall rules).

5. **Build and launch**:
   ```bash
   docker compose up -d --build
   ```

6. **Verify**:
   ```bash
   curl http://localhost/api/tags
   # Should return the default tags JSON
   ```

7. **(Optional) Set up a domain** — point your DNS A record to the server IP, then add an nginx/Caddy reverse proxy with TLS in front of port 80.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_USER` | *(empty)* | MySQL username |
| `DB_PASS` | *(empty)* | MySQL password |
| `DB_HOST` | `127.0.0.1` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `mitiga` | Database name |
| `ENCRYPTION_KEY` | built-in 32-byte key | AES-256 encryption key (must be exactly 32 bytes) |
| `JWT_SECRET` | built-in secret | JWT signing secret |
| `CORS_ORIGINS` | *(empty)* | Additional allowed origins (comma-separated) |
| `PORT` | `8091` | Backend server port (inside container) |
| `BACKEND_PORT` | `8091` | Backend port on host (docker-compose) |
| `FRONTEND_PORT` | `80` | Frontend port on host (docker-compose) |

## Project Structure

```
mitiga-go/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── cmd/
│   │   ├── main.go              # Entry point
│   │   ├── config.go            # Local DB defaults (gitignored)
│   │   └── config.go.docker     # Docker build defaults
│   └── internal/
│       ├── crypto/crypto.go     # AES-256-GCM encrypt/decrypt
│       ├── database/database.go # MySQL + encrypted CRUD
│       ├── handlers/handlers.go # HTTP route handlers
│       ├── middleware/auth.go   # JWT auth + approval middleware
│       └── models/models.go     # Data models
└── frontend/
    ├── Dockerfile
    ├── nginx.conf               # Production nginx config
    └── src/
        ├── components/          # Reusable components
        ├── context/AuthContext.jsx
        ├── hooks/useApi.js      # API client
        └── pages/               # Route pages
```

## API Endpoints

| Method | Path | Auth | Approved | Description |
|--------|------|------|----------|-------------|
| POST | `/api/register` | No | No | Register new user |
| POST | `/api/login` | No | No | Login |
| GET | `/api/profile` | Yes | No | Get current user + approval status |
| GET | `/api/tags` | Yes | Yes | List all tags |
| POST | `/api/gossips` | Yes | Yes | Create gossip |
| GET | `/api/gossips` | Yes | Yes | List gossips (optional `?tag=` filter) |
| GET | `/api/gossips/:id` | Yes | Yes | Get single gossip |
| POST | `/api/gossips/:id/like` | Yes | Yes | Toggle like |
| POST | `/api/gossips/:id/comments` | Yes | Yes | Add comment |
| GET | `/api/gossips/:id/comments` | Yes | Yes | List comments |
| POST | `/api/nicknames` | Yes | Yes | Create/update nickname |
| GET | `/api/nicknames` | Yes | Yes | List user's nicknames |
| DELETE | `/api/nicknames/:id` | Yes | Yes | Delete nickname |
| GET | `/api/nickname-map` | Yes | Yes | Get all nickname→real name mappings |
| GET | `/api/scoreboard` | Yes | Yes | Get scoreboard rankings |
| GET | `/api/pending-users` | Yes | Yes | List users awaiting approval |
| POST | `/api/approve/:id` | Yes | Yes | Approve a pending user |
| POST | `/api/reject/:id` | Yes | Yes | Reject a pending user |
