from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

import os

# Adaptado para Vercel: Ambientes Serverless possuem sistema de arquivos "Read-Only" (somente leitura).
# A única pasta com permissão de escrita nesses ambientes de nuvem é a "/tmp".
database_path = "/tmp/local_eats.db" if os.environ.get("VERCEL") else "./local_eats.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{database_path}"

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
