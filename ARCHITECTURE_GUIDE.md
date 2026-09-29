# 🛒 Mini E-Commerce API — Complete Modular Architecture & Learning Guide

This guide explains the **production-grade modular architecture**, **why each file exists**, **how it works**, and **the comprehensive list of all technical topics covered** across all 5 levels of the project. Keep this file as your permanent master reference!

---

## 🌟 The Big Picture Flow

When a frontend UI or user makes a request, here is how data travels through the modular folders:

```text
       👤 CLIENT (Frontend UI: React / Vue / HTML / Swagger)
                          │
                          │  1. Sends HTTP Request (JSON + Bearer Token)
                          ▼
                  ┌───────────────┐
                  │  app/main.py  │  ◄── Creates App, Configures CORS, Registers Routers
                  └───────┬───────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
     ┌─────────────────┐     ┌──────────────────┐
     │  app/routers/   │     │   app/schemas/   │
     │ (auth, products,│◄───►│ (user, product,  │
     │  cart, orders)  │     │  cart, order)    │
     └────────┬────────┘     └──────────────────┘
              │
              ├────────────────────────┐
              ▼                        ▼
     ┌─────────────────┐      ┌─────────────────┐
     │   app/auth.py   │      │ app/database.py │
     │ (Checks Token & │      │ (Session pooled │
     │  Enforces RBAC) │      │  via get_db)    │
     └─────────────────┘      └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  app/models/    │  ◄── Separate model files
                              │ (user, product, │      (Translates to SQL)
                              │  cart, order)   │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   POSTGRESQL    │  ◄── Permanent Storage on Disk
                              │ (ecommerce_db)  │
                              └─────────────────┘
```

---

## 📁 The Production Folder Structure

```text
ecommerce_api/
│
├── app/
│   ├── __init__.py
│   ├── main.py                  ◄── Slim entry point (~65 lines): CORS + Router registration
│   ├── database.py              ◄── Connection pooling, SessionLocal, get_db
│   ├── auth.py                  ◄── bcrypt hashing, JWT tokens, get_current_user & admin
│   │
│   ├── models/                  ◄── 📦 DATABASE MODELS (SQLAlchemy)
│   │   ├── __init__.py          (Re-exports all models cleanly)
│   │   ├── user.py              (User table + relationships)
│   │   ├── product.py           (Product table)
│   │   ├── cart.py              (CartItem junction table)
│   │   └── order.py             (Order & OrderItem tables)
│   │
│   ├── schemas/                 ◄── 🛡️ DATA VALIDATION (Pydantic v2)
│   │   ├── __init__.py          (Re-exports all schemas cleanly)
│   │   ├── user.py              (UserCreate, UserResponse, Token)
│   │   ├── product.py           (ProductCreate, ProductUpdate, ProductResponse)
│   │   ├── cart.py              (CartItemCreate, CartItemOut, CartSummaryResponse)
│   │   └── order.py             (OrderItemOut, OrderResponse)
│   │
│   └── routers/                 ◄── 🌐 API ROUTES (APIRouter)
│       ├── __init__.py          (Re-exports all routers)
│       ├── auth.py              (/auth/register, /auth/login, /auth/me)
│       ├── products.py          (/products CRUD + Admin routes)
│       ├── cart.py              (/cart routes + stock checks)
│       └── orders.py            (/orders checkout + /admin/orders)
│
├── .env                         ◄── Local database credentials & secrets
├── requirements.txt             ◄── Pinned dependencies
└── ARCHITECTURE_GUIDE.md        ◄── This documentation guide
```

---

## 📚 Complete Checklist of Topics Covered

### 1. FastAPI Framework & API Design
- [x] **Modular `APIRouter` Architecture:** Splitting large applications into cohesive domain routers (`auth.py`, `products.py`, `cart.py`, `orders.py`).
- [x] **CORS Middleware (`CORSMiddleware`):** Configured to allow cross-origin requests from any frontend UI (React, Vue, Vite, or plain HTML/JS).
- [x] **HTTP Verbs & REST Conventions:** `GET` (fetch), `POST` (create), `PUT` (update), `DELETE` (remove).
- [x] **Path Parameters:** Capturing specific entity IDs from URLs (e.g., `/products/{product_id}`).
- [x] **Query Parameters & Pagination:** Handling optional URL query strings (e.g., `/products?skip=0&limit=20`).
- [x] **Request Body JSON Parsing:** Automatically receiving and parsing JSON payloads into Python objects.
- [x] **Response Models (`response_model`):** Shaping and filtering sensitive data before returning JSON to clients.
- [x] **Standard HTTP Status Codes:** `200 OK`, `201 Created`, `204 No Content`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`.
- [x] **Dependency Injection (`Depends`):** Injecting database sessions and authentication guards into endpoints.
- [x] **Swagger UI / OpenAPI Documentation:** Auto-generated interactive documentation at `/docs` with JWT Bearer authorization support.
- [x] **Startup Seeding Events (`@app.on_event("startup")`):** Pre-populating default users and admin accounts on server boot.

---

### 2. PostgreSQL & Relational Database Architecture
- [x] **PostgreSQL 18 Local Setup:** Configuring and running PostgreSQL service on Windows (port `5432`).
- [x] **Connection URI & URL Encoding:** Formatting connection strings and encoding special characters (e.g., `@` encoded as `%40`).
- [x] **Database Normalization (1NF, 2NF, 3NF):** Structuring tables to eliminate duplicate data.
- [x] **Primary Keys (`PK`) & Indexes:** Unique identifiers and database B-Tree index lookup optimization.
- [x] **Foreign Keys (`FK`):** Linking child tables to parent tables (`users.id`, `products.id`) for referential integrity.
- [x] **Cascading Deletes (`ondelete="CASCADE"`):** Automatically removing orphaned cart items and orders when a user account is deleted.
- [x] **Bridge / Junction Tables:** Implementing Many-to-Many relationships via `cart_items` and `order_items`.
- [x] **Live Schema Alterations:** Executing SQL DDL (`ALTER TABLE users ADD COLUMN IF NOT EXISTS role...`).

---

### 3. SQLAlchemy ORM (Object-Relational Mapping)
- [x] **Engine Management (`create_engine`):** Connection pool management.
- [x] **Session Factory (`sessionmaker`):** Producing isolated transactional sessions.
- [x] **Declarative Base (`declarative_base`):** Python class to SQL table abstraction.
- [x] **Session Lifecycle Management (`get_db`):** Generator pattern with `yield db` and `finally: db.close()` to prevent connection leaks.
- [x] **ORM Querying:** Using `.query()`, `.filter()`, `.first()`, `.all()`, `.offset()`, `.limit()`, and `.order_by()`.
- [x] **CRUD Operations in ORM:** Adding (`db.add`), committing (`db.commit`), refreshing (`db.refresh`), and deleting (`db.delete`).
- [x] **Dynamic Updates (`setattr`):** Dynamically updating model attributes from dictionary keys.
- [x] **SQLAlchemy `relationship()`:** Navigating foreign relationships using dot notation (`cart_item.product.name`) without writing raw SQL `JOIN` statements.

---

### 4. Data Validation with Pydantic v2
- [x] **Schema Inheritance:** Building clean hierarchies (`ProductBase` -> `ProductCreate` -> `ProductResponse`).
- [x] **Input Validation (`Field`):** Enforcing business constraints (e.g. `price: float = Field(..., gt=0)`, `stock: int = Field(..., ge=0)`).
- [x] **Partial Update Handling:** Using `model_dump(exclude_unset=True)` to prevent overwriting unchanged fields with `None`.
- [x] **ORM Mode (`from_attributes = True`):** Enabling Pydantic to read data directly from SQLAlchemy object attributes.

---

### 5. Authentication & Cryptography (AuthN)
- [x] **Password Security Best Practices:** Why plain text passwords must never be stored.
- [x] **One-Way Cryptographic Hashing (`bcrypt`):** Generating salted hashes (`$2b$12$...`) so identical passwords produce completely different hashes.
- [x] **Password Verification (`bcrypt.checkpw`):** Comparing login passwords securely against hashes with error handling for legacy salts.
- [x] **JSON Web Tokens (JWT):** Token structure (Header, Payload, Signature), claims (`sub`), and expiration timestamps (`exp`).
- [x] **Cryptographic Signing (`python-jose`):** Signing and verifying JWTs using the HMAC-SHA256 (`HS256`) algorithm.
- [x] **OAuth2 Password Flow:** Implementing `OAuth2PasswordBearer` and `OAuth2PasswordRequestForm`.
- [x] **Header Extraction:** Receiving and validating `Authorization: Bearer <token>` on protected routes.
- [x] **Authentication Dependency (`get_current_user`):** Intercepting requests, decoding tokens, and fetching user entities from PostgreSQL.

---

### 6. Authorization & Role-Based Access Control (AuthZ / RBAC)
- [x] **Authentication vs. Authorization:** Distinguishing *"Who are you?"* (token) from *"What are you allowed to do?"* (role).
- [x] **Role Modeling:** Adding user roles (`"user"` and `"admin"`).
- [x] **Dependency Chaining:** Implementing `get_current_admin(current_user: User = Depends(get_current_user))` to enforce admin privileges.
- [x] **Access Control Enforcement:** Restricting product creation, updating, deletion, and store-wide order inspection to admins only.
- [x] **401 vs. 403 Distinctions:** Returning `401 Unauthorized` for missing logins and `403 Forbidden` for insufficient privileges.

---

### 7. Database Transactions & Order Processing (ACID)
- [x] **ACID Principles:** Understanding Atomicity — all steps must succeed, or none are saved.
- [x] **Multi-Step Checkout Workflow:**
  1. Cart validation (ensuring items exist).
  2. Stock availability check across all cart items.
  3. Order header creation.
  4. Line items creation (`order_items`).
  5. Stock inventory reduction.
  6. Cart emptying.
- [x] **Transaction Staging (`db.flush()`):** Sending SQL to PostgreSQL to generate order sequence IDs without finalizing the transaction.
- [x] **Transaction Finalization (`db.commit()`):** Committing all changes simultaneously.
- [x] **Transaction Rollback (`db.rollback()`):** Safely canceling partial changes if any validation or database error occurs.
- [x] **Historical Price Freezing:** Capturing snapshot product prices in `order_items` so future catalog price changes do not distort past orders.

---

### 8. DevOps & Environment Configuration
- [x] **Secret Management:** Storing database credentials and secrets inside `.env` (excluded from version control).
- [x] **Safe Environment Templates (`.env.example`):** Providing sanitized template files with placeholder variables so developers can setup the project without leaking sensitive database passwords.
- [x] **Git Security & Secret Protection (`.gitignore`):** Configuring repository-level and backend-level `.gitignore` rules to permanently prevent `.env` credentials, virtual environments (`venv/`), Python bytecode (`__pycache__/`), and frontend dependencies (`node_modules/`, `dist/`) from entering Git history.
- [x] **Environment Parsing:** Loading environment variables using `python-dotenv`.
- [x] **Dependency Management:** Specifying package versions in `requirements.txt`.
- [x] **Development Server:** Running ASGI applications with hot-reloading using `uvicorn app.main:app --reload`.


---

### 9. Frontend Engineering & Human-Crafted UI (Vite + React + TypeScript)
- [x] **Strict Segregation:** Complete separation of `backend/` and `frontend/` services.
- [x] **Dynamic Theme System:** Smooth transition between **Clean Daylight** (light mode) and **Dark Velvet** (dark mode) with CSS design tokens and `localStorage` persistence.
- [x] **Refactored Typography:** Balanced human scales using `Plus Jakarta Sans` (14–15px body) and `Outfit` (tight letter-spaced headers) for optimal readability without AI bloating.
- [x] **Real E-Commerce Imagery:** High-resolution lifestyle and hardware photography with hover-zoom and SKU resolution.
- [x] **Interactive E-Commerce Catalog:**
  - Announcement bar and promotional messaging.
  - Split Hero Showcase with 1-click Quick Add.
  - Value proposition trust pillars (Free Shipping $150+, PostgreSQL ACID Guarantee, 30-Day Returns, 2-Year Warranty).
  - Multi-criteria filtering (search keyword, category chips, in-stock only, price/rating sorting).
  - Interactive Wishlist heart toggle with client-side persistence.
  - Product Quick Preview modal with rating reviews, stock bars, and quantity selector.
  - Slide-out Cart Drawer with animated Free Shipping goal tracker ($150 target).
- [x] **RBAC Separated Dashboards:**
  - **Customer Portal (`role: user`):** Lifetime purchase metrics, completed orders count, and visual 4-step delivery progress timeline (`Confirmed` → `Processing` → `In Transit` → `Delivered`).
  - **Admin Command & Analytics Deck (`role: admin`):** Gross Revenue, live orders stream, catalog manager with inline Edit/Delete, and 403 Forbidden guard protection for non-admins.

