# TaskFlow API Documentation

**Base URL:** `http://localhost:5000/api/v1`  
**Interactive Docs:** `http://localhost:5000/api-docs`  
**Version:** 1.0.0

---

## Authentication

TaskFlow uses **JWT Bearer tokens**. Include the access token in every protected request:

```
Authorization: Bearer <accessToken>
```

Tokens expire in **7 days**. Use the `/auth/refresh` endpoint to get a new one without re-logging in.

---

## Default Admin Credentials

| Email | Password | Role |
|---|---|---|
| admin@taskflow.com | Admin@123 | admin |

---

## Endpoints Overview

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/auth/register` | ❌ | Any | Register new user |
| POST | `/auth/login` | ❌ | Any | Login, get tokens |
| POST | `/auth/refresh` | ❌ | Any | Refresh access token |
| POST | `/auth/logout` | ✅ | Any | Invalidate refresh token |
| GET | `/auth/me` | ✅ | Any | Get own profile |
| PATCH | `/auth/me` | ✅ | Any | Update name |
| PATCH | `/auth/me/password` | ✅ | Any | Change password |
| GET | `/tasks` | ✅ | Any | List tasks (admin: all) |
| POST | `/tasks` | ✅ | Any | Create task |
| GET | `/tasks/stats` | ✅ | Any | Task statistics |
| GET | `/tasks/:id` | ✅ | Any | Get single task |
| PATCH | `/tasks/:id` | ✅ | Any | Update task |
| DELETE | `/tasks/:id` | ✅ | Any | Delete task |
| GET | `/admin/stats` | ✅ | Admin | Platform statistics |
| GET | `/admin/users` | ✅ | Admin | List all users |
| PATCH | `/admin/users/:id` | ✅ | Admin | Update user role/status |
| DELETE | `/admin/users/:id` | ✅ | Admin | Delete user |

---

## Auth Endpoints

### `POST /auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Secret@123"
}
```

> Password rules: min 8 chars, 1 uppercase, 1 number

**Response `201`:**
```json
{
  "success": true,
  "message": "Registration successful",
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "created_at": "2026-03-28T18:00:00Z"
  }
}
```

**Error Responses:**
| Code | Reason |
|---|---|
| `409` | Email already registered |
| `422` | Validation failed (name/email/password rules) |

---

### `POST /auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@taskflow.com",
  "password": "Admin@123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Super Admin",
    "email": "admin@taskflow.com",
    "role": "admin",
    "is_active": true
  }
}
```

**Error Responses:**
| Code | Reason |
|---|---|
| `401` | Invalid email or password |
| `403` | Account deactivated |

---

### `POST /auth/refresh`
Get a new access token using a refresh token (token rotation — old refresh token is invalidated).

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Token refreshed",
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

---

### `POST /auth/logout`
🔒 Invalidates the refresh token in the database.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### `GET /auth/me`
🔒 Get the current authenticated user's profile.

**Response `200`:**
```json
{
  "success": true,
  "message": "Profile fetched",
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Super Admin",
    "email": "admin@taskflow.com",
    "role": "admin",
    "is_active": true,
    "created_at": "2026-03-28T18:00:00Z",
    "updated_at": "2026-03-28T18:00:00Z"
  }
}
```

---

### `PATCH /auth/me`
🔒 Update the current user's name.

**Request Body:**
```json
{
  "name": "Jane Smith"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Profile updated",
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "user",
    "updated_at": "2026-03-28T19:00:00Z"
  }
}
```

---

### `PATCH /auth/me/password`
🔒 Change password. **Invalidates all active sessions.**

**Request Body:**
```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@456"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Password changed. Please log in again."
}
```

**Error Responses:**
| Code | Reason |
|---|---|
| `400` | Current password is incorrect |

---

## Task Endpoints

### `GET /tasks`
🔒 Get tasks. Regular users see **only their own tasks**. Admins see **all tasks**.

**Query Parameters:**
| Param | Type | Description | Example |
|---|---|---|---|
| `status` | string | Filter by status | `pending` \| `in_progress` \| `completed` \| `cancelled` |
| `priority` | string | Filter by priority | `low` \| `medium` \| `high` |
| `search` | string | Search title & description | `fix bug` |
| `page` | integer | Page number (default: `1`) | `2` |
| `limit` | integer | Items per page (default: `10`) | `20` |

**Response `200`:**
```json
{
  "success": true,
  "message": "Tasks fetched",
  "tasks": [
    {
      "id": "abc123",
      "title": "Build REST API",
      "description": "Implement all CRUD endpoints",
      "status": "in_progress",
      "priority": "high",
      "due_date": "2026-12-31",
      "user_id": "3fa85f64...",
      "owner_name": "Jane Doe",
      "owner_email": "jane@example.com",
      "created_at": "2026-03-28T18:00:00Z",
      "updated_at": "2026-03-28T18:00:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### `POST /tasks`
🔒 Create a new task.

**Request Body:**
```json
{
  "title": "Build REST API",
  "description": "Implement all CRUD endpoints",
  "status": "pending",
  "priority": "high",
  "due_date": "2026-12-31"
}
```

> Only `title` is required. All other fields are optional.

**Response `201`:**
```json
{
  "success": true,
  "message": "Task created",
  "task": {
    "id": "abc123",
    "title": "Build REST API",
    "description": "Implement all CRUD endpoints",
    "status": "pending",
    "priority": "high",
    "due_date": "2026-12-31",
    "user_id": "3fa85f64...",
    "created_at": "2026-03-28T18:00:00Z",
    "updated_at": "2026-03-28T18:00:00Z"
  }
}
```

---

### `GET /tasks/stats`
🔒 Get task count statistics for the current user.

**Response `200`:**
```json
{
  "success": true,
  "message": "Stats fetched",
  "stats": {
    "total": "10",
    "pending": "3",
    "in_progress": "4",
    "completed": "2",
    "cancelled": "1",
    "high_priority": "5"
  }
}
```

---

### `GET /tasks/:id`
🔒 Get a single task by ID. Users can only fetch their own tasks; admins can fetch any.

**Path Parameter:** `id` — UUID of the task

**Response `200`:**
```json
{
  "success": true,
  "message": "Task fetched",
  "task": {
    "id": "abc123",
    "title": "Build REST API",
    "status": "in_progress",
    "priority": "high",
    "owner_name": "Jane Doe",
    "owner_email": "jane@example.com"
  }
}
```

**Error Responses:**
| Code | Reason |
|---|---|
| `404` | Task not found or not owned by user |
| `422` | Invalid UUID format |

---

### `PATCH /tasks/:id`
🔒 Partially update a task. Only the fields you provide are updated.

**Path Parameter:** `id` — UUID of the task

**Request Body (all fields optional):**
```json
{
  "title": "Updated title",
  "description": "New description",
  "status": "completed",
  "priority": "low",
  "due_date": "2027-01-01"
}
```

**Status values:** `pending` | `in_progress` | `completed` | `cancelled`  
**Priority values:** `low` | `medium` | `high`

**Response `200`:**
```json
{
  "success": true,
  "message": "Task updated",
  "task": { "...updated task object..." }
}
```

---

### `DELETE /tasks/:id`
🔒 Delete a task. Users can only delete their own; admins can delete any.

**Response `200`:**
```json
{
  "success": true,
  "message": "Task deleted"
}
```

---

## Admin Endpoints

> **All admin endpoints require `role: admin`**. Returns `403` if accessed by a regular user.

### `GET /admin/stats`
🔑 Get platform-wide statistics.

**Response `200`:**
```json
{
  "success": true,
  "message": "Platform stats fetched",
  "stats": {
    "users": {
      "total_users": "25",
      "admins": "2",
      "inactive_users": "3"
    },
    "tasks": {
      "total_tasks": "147",
      "pending": "45",
      "in_progress": "60",
      "completed": "38",
      "high_priority": "32"
    }
  }
}
```

---

### `GET /admin/users`
🔑 List all users with pagination and filters.

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `search` | string | Search by name or email |
| `role` | string | Filter by role: `user` \| `admin` |
| `page` | integer | Page number (default: `1`) |
| `limit` | integer | Items per page (default: `20`) |

**Response `200`:**
```json
{
  "success": true,
  "message": "Users fetched",
  "users": [
    {
      "id": "3fa85f64...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "is_active": true,
      "created_at": "2026-03-28T18:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

---

### `PATCH /admin/users/:id`
🔑 Update a user's role or active status.

**Path Parameter:** `id` — UUID of the user

**Request Body (all fields optional):**
```json
{
  "role": "admin",
  "is_active": false
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "User updated",
  "user": {
    "id": "3fa85f64...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "admin",
    "is_active": false,
    "updated_at": "2026-03-28T19:00:00Z"
  }
}
```

**Error Responses:**
| Code | Reason |
|---|---|
| `400` | Cannot modify your own admin account |
| `404` | User not found |

---

### `DELETE /admin/users/:id`
🔑 Permanently delete a user and all their tasks (cascade).

**Response `200`:**
```json
{
  "success": true,
  "message": "User deleted"
}
```

---

## Health Check

### `GET /api/health`
No auth required. Use to verify the API is running.

**Response `200`:**
```json
{
  "success": true,
  "status": "OK",
  "version": "1.0.0",
  "timestamp": "2026-03-28T18:00:00.000Z"
}
```

---

## Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [
    { "field": "email", "message": "Valid email is required" }
  ]
}
```

> `errors` array is only present on validation failures (`422`).

---

## Common HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Bad request (invalid input) |
| `401` | Unauthorized (missing or expired token) |
| `403` | Forbidden (valid token but insufficient role, or CORS) |
| `404` | Resource not found |
| `409` | Conflict (e.g. email already exists) |
| `422` | Validation error |
| `429` | Too many requests (rate limit: 100 req / 15 min) |
| `500` | Internal server error |

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP
- **Headers returned:** `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- **On exceed:** `429 Too Many Requests`

---

## Quick Test with curl

```bash
# 1. Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@taskflow.com","password":"Admin@123"}'

# 2. Create a task (replace TOKEN with accessToken from step 1)
curl -X POST http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My first task","priority":"high","due_date":"2026-12-31"}'

# 3. Get all tasks
curl http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer TOKEN"

# 4. Get platform stats (admin only)
curl http://localhost:5000/api/v1/admin/stats \
  -H "Authorization: Bearer TOKEN"
```
