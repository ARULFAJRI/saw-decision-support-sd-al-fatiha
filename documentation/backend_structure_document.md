# Backend Structure Document for Decision Support System (DSS)

This document outlines the backend architecture, data management, APIs, hosting, infrastructure, security, and maintenance plans for the Decision Support System tailored for SD Islam Al Fatiha. The goal is to provide a clear overview so that any stakeholder—technical or not—can understand how the backend is organized and why these choices were made.

## 1. Backend Architecture

**Overview**  
We will use a Node.js server with Express (or a similar HTTP framework) written in TypeScript. The code follows a layered pattern to separate concerns:  

- **Controllers (API layer):** Handle incoming HTTP requests and send responses.  
- **Services (Business logic):** Contain the core decision-making algorithm (SAW) and other processing.  
- **Data Access (Repository) layer:** Interact with the database through Drizzle ORM.  
- **Middleware:** Manage authentication, error handling, logging, and request parsing.

**Design Patterns & Frameworks**  
- MVC-inspired layering for clarity and maintainability.  
- Dependency injection for services and repositories (e.g., using `tsyringe` or `InversifyJS`).  
- Drizzle ORM for type-safe database interactions.  

**Scalability**  
- The server is stateless, allowing horizontal scaling behind a load balancer.  
- Database connection pooling ensures efficient use of resources under load.  

**Maintainability**  
- TypeScript provides type safety across layers.  
- Clear folder structure (`controllers/`, `services/`, `repositories/`, `models/`, `middlewares/`).  
- Unit tests for business logic (`utils/saw.ts`) using Vitest or Jest.

**Performance**  
- Caching frequent queries (e.g., student lists) with Redis.  
- Database indexes on foreign keys and frequently filtered columns.  
- GZIP compression and HTTP/2 support on the API.

## 2. Database Management

**Technology Choice**  
- **Type:** Relational (SQL)  
- **System:** PostgreSQL  
- **ORM:** Drizzle ORM (TypeScript-first, lightweight)

**Data Structure & Access**  
- Data is organized in normalized tables (Users, Students, Criteria, Evaluations, Results).  
- Repositories expose basic CRUD methods: `create`, `findAll`, `findById`, `update`, `delete`.  
- All queries use parameterized statements to prevent SQL injection.  

**Data Management Practices**  
- Regular backups via automated RDS snapshots (if hosted on AWS).  
- Migrations managed with Drizzle CLI.  
- Connection pooling to optimize performance.

## 3. Database Schema

Below is a human-readable overview and corresponding PostgreSQL schema.

**Tables and Key Columns**  
- **Users**: id, name, email, password_hash, role (Admin/Guru), created_at, updated_at  
- **Students**: id, full_name, class, created_at, updated_at  
- **Criteria**: id, name, weight (numeric), created_at, updated_at  
- **Evaluations**: id, student_id (FK), evaluated_at (timestamp), evaluator_id (FK), created_at  
- **EvaluationResults**: id, evaluation_id (FK), criteria_id (FK), raw_score, normalized_score, weighted_score

**PostgreSQL Schema**  
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin','Guru')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  class TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criteria table
CREATE TABLE criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Evaluations table
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES users(id),
  evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- EvaluationResults table
CREATE TABLE evaluation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
  criteria_id UUID REFERENCES criteria(id),
  raw_score NUMERIC NOT NULL,
  normalized_score NUMERIC,
  weighted_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```  

## 4. API Design and Endpoints

We follow RESTful principles with JSON payloads. All endpoints are prefixed with `/api`.

**Authentication**  
- POST `/api/auth/login` – Validate credentials, return JWT token.  
- POST `/api/auth/logout` – Invalidate token (optional) or rely on client token deletion.  
- GET `/api/auth/me` – Retrieve current user info from JWT.

**Students**  
- GET `/api/students` – List all students.  
- GET `/api/students/:id` – Get student details.  
- POST `/api/students` – Create new student.  
- PUT `/api/students/:id` – Update student.  
- DELETE `/api/students/:id` – Remove student.

**Criteria**  
- GET `/api/criteria`  
- POST `/api/criteria`  
- PUT `/api/criteria/:id`  
- DELETE `/api/criteria/:id`

**Evaluations**  
- POST `/api/evaluations` – Submit a new evaluation (student + scores).  
- GET `/api/evaluations` – List evaluations with filters (by student, date).

**Reports & Exports**  
- GET `/api/reports/summary` – JSON summary of latest rankings.  
- GET `/api/reports/pdf` – Generate and return PDF.  
- GET `/api/reports/excel` – Generate and return XLSX.

Middleware enforces JWT validation and role-based access control on protected routes.

## 5. Hosting Solutions

We recommend a cloud-based, containerized deployment for reliability and easy scaling.

- **Containerization:** Docker images for API and background workers.  
- **Orchestration:** AWS ECS/Fargate or Kubernetes (EKS/GKE).  
- **Database Hosting:** AWS RDS with PostgreSQL (multi-AZ for failover).  
- **Static Assets & CDN:** Frontend deployed to Vercel or Netlify; assets served via CloudFront or equivalent CDN.

**Benefits**  
- High availability with multi-AZ and auto-scaling.  
- Pay-as-you-go pricing.  
- Simplified deployments via CI/CD pipelines (GitHub Actions).

## 6. Infrastructure Components

- **Load Balancer:** AWS ALB or equivalent, distributing API traffic across containers.  
- **Caching:** Redis cluster for session caching and query results.  
- **CDN:** CloudFront for static assets, improving frontend performance globally.  
- **Message Queue (optional):** RabbitMQ or AWS SQS for heavy tasks (e.g., report generation).  
- **Storage:** S3 buckets for storing generated PDFs/Excel files if needed.

Together, these components ensure low latency, fault tolerance, and a smooth user experience.

## 7. Security Measures

- **Authentication:** JWT tokens signed with strong secret keys, short-lived with refresh tokens.  
- **Authorization:** Role checks (Admin vs Guru) at the route/method level.  
- **Password Security:** Bcrypt hashing with adequate work factor.  
- **Data Encryption:** TLS/HTTPS for all network traffic; encryption at rest on RDS and S3.  
- **Vulnerability Mitigation:** Helmet middleware, rate limiting (e.g., express-rate-limit), CORS configuration.  
- **Secrets Management:** Environment variables stored in AWS Secrets Manager or Vault.

## 8. Monitoring and Maintenance

- **Logging:** Structured logs (JSON) collected by a centralized system (ELK stack or CloudWatch).  
- **Metrics & Alerts:** Prometheus + Grafana or AWS CloudWatch Metrics with alarms on high error rates, CPU/memory spikes.  
- **Error Tracking:** Sentry for capturing exceptions in API services.  
- **Backup & Recovery:** Daily automated RDS snapshots; weekly full exports.  
- **CI/CD:** GitHub Actions pipelines run tests, linting, and deploy on merge to main.

## 9. Conclusion and Overall Backend Summary

The backend for the Decision Support System is a modern, scalable, and secure Node.js service powered by TypeScript, Express, and PostgreSQL (via Drizzle ORM). It separates concerns into clear layers, exposes RESTful APIs for all key operations (authentication, student/criteria management, evaluations, and reporting), and is designed for a containerized cloud environment. Caching, load balancing, monitoring, and security best practices ensure reliable performance and data protection.

This setup meets the project’s goals:

- **Scalability:** Stateless services and auto-scaling clusters handle growth smoothly.  
- **Maintainability:** Type safety, modular code, and clear architecture support easy updates.  
- **Performance:** Caching, CDNs, and optimized queries deliver fast responses.  
- **Security & Compliance:** Industry-standard measures protect user data and meet regulatory expectations.

By following this document, the development and operations teams can align on the backend’s structure and deliver a robust Decision Support System for SD Islam Al Fatiha.