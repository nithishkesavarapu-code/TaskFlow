# TaskFlow API

> Scalable REST API with JWT Authentication, Role-Based Access Control, and a React-style frontend — built as a Backend Intern assignment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20 + Express.js |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT (access + refresh token rotation) |
| **Password hashing** | bcrypt (cost factor 12) |
| **Validation** | express-validator |
| **API Docs** | Swagger / OpenAPI 3.0 |
| **Logging** | Winston |
| **Security** | Helmet, CORS, rate-limiting |
| **Caching (optional)** | Redis |
| **Deployment** | Docker + Docker Compose |
| **Frontend** | Vanilla JS + Tailwind CSS |

---

## Features

### 🔐 Authentication
- User registration with password hashing (bcrypt, cost 12)
- Login with JWT access token (7d) + refresh token (30d)
- Automatic token rotation on refresh
- Logout invalidates refresh token in DB
- Change password (invalidates all sessions)

### 👥 Role-Based Access Control
| Feature | User | Admin |
|---|---|---|
| Register / Login | ✅ | ✅ |
| View/create/edit/delete **own** tasks | ✅ | ✅ |
| View & manage **all** tasks | ❌ | ✅ |
| View all users | ❌ | ✅ |
| Update user roles/status | ❌ | ✅ |
| Delete users | ❌ | ✅ |
| Platform-wide stats | ❌ | ✅ |

### ✅ Task CRUD
- Create, Read, Update, Delete tasks
- Filter by status, priority, search query
- Pagination (configurable page size)
- Task statistics (counts by status/priority)
- Quick-complete toggle from the UI

### 🛡️ Security
- Helmet.js security headers
- CORS whitelist
- Global rate limiter (100 req / 15 min per IP)
- Input sanitisation & validation on every route
- 10kb body size limit
- Non-root Docker user

---

## Project Structure

```
taskflow-api/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express entry point
│   │   ├── config/
│   │   │   ├── db.js               # PostgreSQL pool
│   │   │   └── swagger.js          # OpenAPI spec
│   │   ├── controllers/
│   │   │   ├── authController.js   # register, login, refresh, logout, me
│   │   │   ├── taskController.js   # CRUD + stats
│   │   │   └── adminController.js  # user management, platform stats
│   │   ├── middleware/
│   │   │   ├── auth.js             # verifyToken, requireRole
│   │   │   └── validate.js         # express-validator runner
│   │   ├── routes/
│   │   │   ├── index.js            # route aggregator + /health
│   │   │   └── v1/
│   │   │       ├── auth.js         # /api/v1/auth/*
│   │   │       ├── tasks.js        # /api/v1/tasks/*
│   │   │       └── admin.js        # /api/v1/admin/*
│   │   └── utils/
│   │       ├── jwt.js              # sign / verify helpers
│   │       ├── logger.js           # Winston logger
│   │       └── response.js         # sendSuccess, sendError, asyncHandler
│   ├── schema.sql                  # Full DB schema + seed admin
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── frontend/
│   └── index.html                  # Single-page app (no build step)
├── docker-compose.yml
├── nginx.conf
├── SCALABILITY.md
└── README.md
```

---

## Quick Start

### Option A — Docker Compose (Recommended)

```bash
# Clone the repo
git clone https://github.com/<your-username>/taskflow-api.git
cd taskflow-api

# Start everything (API + PostgreSQL + Redis + Frontend)
docker compose up --build

# API:      http://localhost:5000
# Frontend: http://localhost:3000
# Docs:     http://localhost:5000/api-docs
```

### Option B — Manual Setup

#### Prerequisites
- Node.js ≥ 18
- PostgreSQL 14+

#### Steps

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, etc.

# 3. Create database & run schema
createdb taskflow_db
psql taskflow_db -f schema.sql

# 4. Start the server
npm run dev        # development (nodemon)
npm start          # production
```

#### Serve the Frontend

```bash
# Option 1: VS Code Live Server — open frontend/index.html
# Option 2: Python HTTP server
cd frontend && python3 -m http.server 3000
# Option 3: npx serve
npx serve frontend -p 3000
```

> **Note:** If you're not using Docker, update the `API` constant in `frontend/index.html` to match your backend URL.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Access token signing secret (≥32 chars) | — |
| `JWT_EXPIRES_IN` | Access token TTL | `7d` |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | — |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `30d` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

---

## API Reference

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login, returns tokens |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| POST | `/auth/logout` | ✅ | Invalidate refresh token |
| GET | `/auth/me` | ✅ | Get current user profile |
| PATCH | `/auth/me` | ✅ | Update name |
| PATCH | `/auth/me/password` | ✅ | Change password |

### Task Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/tasks` | ✅ | List own tasks (admin: all) |
| GET | `/tasks/stats` | ✅ | Task counts by status/priority |
| GET | `/tasks/:id` | ✅ | Get single task |
| POST | `/tasks` | ✅ | Create task |
| PATCH | `/tasks/:id` | ✅ | Update task (partial) |
| DELETE | `/tasks/:id` | ✅ | Delete task |

### Admin Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/admin/stats` | 🔑 Admin | Platform statistics |
| GET | `/admin/users` | 🔑 Admin | List all users |
| PATCH | `/admin/users/:id` | 🔑 Admin | Update role / active status |
| DELETE | `/admin/users/:id` | 🔑 Admin | Delete a user |

### Query Parameters (GET /tasks)

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by status (`pending`, `in_progress`, `completed`, `cancelled`) |
| `priority` | string | Filter by priority (`low`, `medium`, `high`) |
| `search` | string | Search title & description |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 10) |

---

## Example API Calls

### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"Secret@123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@taskflow.com","password":"Admin@123"}'
```

### Create Task
```bash
curl -X POST http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Build the API","priority":"high","due_date":"2025-12-31"}'
```

### Get Tasks (with filters)
```bash
curl "http://localhost:5000/api/v1/tasks?status=pending&priority=high&page=1" \
  -H "Authorization: Bearer <access_token>"
```

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@taskflow.com | Admin@123 |

> ⚠️ Change this immediately in production.

---

## Interactive API Docs (Swagger)

Visit **http://localhost:5000/api-docs** after starting the server.

1. Use `POST /api/v1/auth/login` with `admin@taskflow.com` / `Admin@123` to get an `accessToken`
2. Click the **Authorize 🔒** button (top right) → paste **only the token** (no `Bearer` prefix) → Authorize
3. All endpoints are now interactive and testable from the browser

---

## Health Check

```bash
curl http://localhost:5000/api/health
# {"success":true,"status":"OK","version":"1.0.0","timestamp":"..."}
```

---

## Scalability

See **[SCALABILITY.md](./SCALABILITY.md)** for a detailed breakdown of:
- Horizontal scaling with load balancers
- PostgreSQL read replicas & connection pooling
- Redis caching strategy
- Microservices decomposition path
- Kubernetes / ECS deployment blueprint

---

## License

MIT
