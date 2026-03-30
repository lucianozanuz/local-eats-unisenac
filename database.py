from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Code Smell: Hardcoded URL inside the database file, no environment variable
SQLALCHEMY_DATABASE_URL = "sqlite:///./local_eats.db"

# Smell: Check_same_thread=False is needed for standard SQLite in FastAPI, but pooling is not optimized
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
