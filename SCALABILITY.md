# TaskFlow — Scalability & Architecture Note

## Current Architecture

```
Client (React/HTML) ──► Nginx ──► Node.js / Express API ──► PostgreSQL
                                          │
                                       Redis (cache)
```

---

## Horizontal Scaling Strategy

### 1. Stateless API Design
All JWT-based authentication is **stateless** — no session data lives on the server.
This means any number of API instances can handle any request without coordination.
Scale by adding replicas behind a load balancer (AWS ALB, Nginx, or HAProxy).

### 2. Load Balancing
```
Clients
  │
  ▼
AWS ALB / Nginx (round-robin or least-connections)
  ├──► API Instance 1
  ├──► API Instance 2
  └──► API Instance N
        │
        ▼
   PostgreSQL (RDS, read replicas for SELECT-heavy routes)
```

### 3. Database Scaling
| Strategy | Implementation |
|---|---|
| **Connection pooling** | `pg` pool (max 20 connections per instance) |
| **Read replicas** | Direct GET queries to replica; writes to primary |
| **Indexing** | Indexes on `users.email`, `tasks.user_id`, `tasks.status` |
| **Future sharding** | Partition `tasks` table by `user_id` when millions of rows |

### 4. Caching with Redis
Currently optional. The architecture is ready for:
- **Rate limiting state** — store rate limit counters in Redis (multi-instance safe)
- **Refresh token store** — move from PostgreSQL to Redis with TTL for O(1) lookups
- **Query cache** — cache `/tasks/stats` and `/admin/stats` responses for 60s

```js

const cached = await redis.get(`stats:${userId}`);
if (cached) return sendSuccess(res, JSON.parse(cached));

await redis.setEx(`stats:${userId}`, 60, JSON.stringify(stats));
```

### 5. Microservices Decomposition (Future)
As traffic grows, split into independent services:

```
API Gateway (Kong / AWS API GW)
  ├──► Auth Service         (register, login, token refresh)
  ├──► Task Service         (CRUD, stats, filtering)
  ├──► Notification Service (email on due-date / status change)
  └──► Admin Service        (user management, platform stats)
```

Each service owns its own database and communicates via:
- **Sync**: REST or gRPC for real-time calls
- **Async**: Message queue (RabbitMQ / AWS SQS) for notifications

### 6. Deployment & CI/CD

| Layer | Tool |
|---|---|
| Containerisation | Docker + Docker Compose |
| Orchestration | Kubernetes (EKS / GKE) or AWS ECS Fargate |
| CI/CD | GitHub Actions → build image → push ECR → deploy |
| Secrets | AWS Secrets Manager / HashiCorp Vault |
| Monitoring | Prometheus + Grafana / AWS CloudWatch |
| Logging | Winston → CloudWatch Logs / ELK Stack |

### 7. Security at Scale
- **HTTPS everywhere** — TLS termination at load balancer
- **Refresh token rotation** — every refresh issues a new token (replay protection)
- **Rate limiting** — per-IP via Redis, survives multi-instance deploys
- **Helmet.js** — sets secure HTTP headers on every response
- **Input sanitisation** — `express-validator` on all POST/PATCH routes
- **bcrypt cost 12** — resistant to GPU brute-force attacks
- **Least-privilege DB user** — API user has no DDL permissions in production

---

## Estimated Capacity (single instance, t3.small)
| Metric | Value |
|---|---|
| Concurrent users | ~500 |
| Requests / second | ~200 |
| Database connections | 20 (pooled) |

Add 1 replica → 2× throughput linearly, no code changes required.
