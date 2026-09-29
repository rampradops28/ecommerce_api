import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load variables from .env file
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/ecommerce_db" #fallback string
)

# 1. Engine: Manages the connection pool to PostgreSQL
engine = create_engine(DATABASE_URL)

# 2. SessionLocal: Factory for database sessions (one session per request)
# Create a factory called SessionLocal that creates database sessions connected to our engine, 
# without automatically committing or flushing changes.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Base: Common declarative class for all SQLAlchemy ORM models
Base = declarative_base()

# 4. Dependency: Provides a DB session to FastAPI route handlers, ensuring it closes afterwards
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
