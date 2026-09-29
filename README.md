# 🧭 MERIDIAN — Curated Essentials & Modern Commerce

A modular full-stack e-commerce platform built with **FastAPI**, **PostgreSQL 18**, and a **Vite + React + TypeScript** Single Page Application designed with a clean, neat, eye-friendly aesthetic and strict Role-Based Access Control (RBAC).

---

## ✨ Design & Architecture Highlights
1. **Unique Identity**: **MERIDIAN** — Built around curated living, precision timepieces, footwear, and acoustic hardware.
2. **Eye-Friendly, Simple & Neat Palette**:
   - **Clean Daylight (Light Mode)**: Soothing neutral slate background (`#f8fafc`), crisp white cards (`#ffffff`), classic royal blue accents (`#2563eb`), and forest emerald tags (`#059669`). Zero harsh neon or rainbow eye-strain.
   - **Calming Slate (Dark Mode)**: Deep comforting midnight slate (`#0f172a`), soft elevated surfaces (`#1e293b`), and clear readable typography (`#f8fafc`).
3. **Balanced Human Typography**: Scaled comfortably (`14px`–`15px` body with `1.55` line-height via `Plus Jakarta Sans`, headers via `Outfit`).
4. **Rich E-Commerce Features**:
   - Curated high-resolution lifestyle photography with subtle hover zoom.
   - Live search, category filter chips (`All`, `Timepieces`, `Footwear`, `Tech`, `Under $100`), and price/rating sorting.
   - Interactive Wishlist heart toggle with local storage persistence.
   - Product Quick Preview modal with customer reviews, stock availability, and quantity stepper.
   - Slide-out Cart Drawer with dynamic Free Shipping progress tracker ($150 target).
5. **Separated RBAC Dashboards**:
   - **Customer Portal (`role: user`)**: Order history cards with visual 4-step delivery progress timeline (`Confirmed` → `Processing` → `In Transit` → `Delivered`), lifetime purchase metrics, and copyable order references.
   - **Admin Command & Analytics Deck (`role: admin`)**: Business KPIs (Gross Revenue, Orders Stream, Catalog Count, Low Stock Warnings), full Inventory Management table (with Add/Edit/Delete products), and global live customer order feed.
   - **Strict RBAC Guard (403 Forbidden Screen)**: Gracefully prevents non-admins from accessing the admin console, with a 1-click button to switch to the Admin persona for testing.
6. **1-Click Persona Switcher**: Instant switching between Customer (`demo@example.com`) and Store Administrator (`admin@example.com`).

---

## 📁 Project Structure

```text
ecommerce_api/
│
├── backend/                  ◄── FastAPI + PostgreSQL Backend
│   ├── app/
│   │   ├── main.py           (CORS + Router assembly + DB seeders)
│   │   ├── database.py       (Connection pooling & get_db)
│   │   ├── auth.py           (bcrypt hashing, JWT & RBAC guards)
│   │   ├── models/           (User, Product, CartItem, Order, OrderItem)
│   │   ├── schemas/          (Pydantic input/output validation)
│   │   └── routers/          (auth, products, cart, orders)
│   ├── .env                  (Database credentials)
│   └── requirements.txt
│
├── frontend/                 ◄── Vite + React + TypeScript Single Page App
│   ├── src/
│   │   ├── App.tsx           (Tactile E-Commerce SPA with RBAC dashboards)
│   │   ├── api.ts            (Fully typed API client for all 5 levels)
│   │   └── index.css         (Soothing design tokens, dark/light theme, typography)
│   ├── index.html            (Google Fonts: Outfit, Plus Jakarta Sans, M logo)
│   └── package.json
│
├── README.md                 ◄── Run commands & quick start
└── ARCHITECTURE_GUIDE.md     ◄── Complete learning & topic reference
```

---

## 🚀 Running the Project

### 1. Start the Backend
Open a terminal:
```powershell
cd c:\Workspace\FastAPI\ecommerce_api\backend
python -m uvicorn app.main:app --reload
```
* **API Server:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **Swagger UI Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 2. Start the Frontend
Open a second terminal:
```powershell
cd c:\Workspace\FastAPI\ecommerce_api\frontend
npm run dev
```
* **Frontend Web App:** [http://127.0.0.1:5173](http://127.0.0.1:5173)

---

## ⚡ Quick Testing Personas
Use the 1-click switchers in the header navigation or log in with:
* **Customer Persona:** `demo@example.com` / `demo1234` (Role: `user`)
* **Administrator Persona:** `admin@example.com` / `admin1234` (Role: `admin`)
