from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, get_db
from app.models.user import User
from app import auth
from app.routers import auth_router, products_router, cart_router, orders_router

# Automatically create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mini E-Commerce API",
    description="A modular, production-grade e-commerce REST API built with FastAPI and PostgreSQL.",
    version="1.0.0",
)

# ==========================================
# CORS CONFIGURATION (Ready for Frontend UI)
# ==========================================
# Enables web browsers (React, Vue, Next.js, or plain HTML/JS) to make requests to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain (e.g. http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_initial_data():
    """Seed initial demo shopper and admin account with bcrypt-hashed passwords."""
    db = next(get_db())

    # 1. Customer Demo User
    demo_user = db.query(User).filter(User.email == "demo@example.com").first()
    if not demo_user:
        demo_user = User(
            name="Demo Shopper",
            email="demo@example.com",
            password_hash=auth.hash_password("demo1234"),
            role="user",
        )
        db.add(demo_user)

    # 2. Administrator Account
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin_user:
        admin_user = User(
            name="Store Admin",
            email="admin@example.com",
            password_hash=auth.hash_password("admin1234"),
            role="admin",
        )
        db.add(admin_user)

    db.commit()
    db.close()


# ==========================================
# REGISTER ROUTERS
# ==========================================
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Mini E-Commerce API is running (Modular Architecture)"}
