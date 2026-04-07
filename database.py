from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

import os

# Configuração do Banco de Dados
# Lemos do ambiente para suportar Supabase no Vercel. Caso contrário, usamos SQLite local.
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # SQLAlchemy 1.4+ requer "postgresql://" ao invés de "postgres://"
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    # Se for Postgres, não precisamos do check_same_thread
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
else:
    # Fallback para SQLite local
    database_path = "/tmp/local_eats.db" if os.environ.get("VERCEL") else "./local_eats.db"
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{database_path}"
    # Smell: Check_same_thread=False is needed for standard SQLite in FastAPI
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
