from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import models
from database import engine

models.Base.metadata.create_all(bind=engine)

# Auto-seed para ambientes efêmeros (como Vercel)
def check_and_seed():
    from database import SessionLocal
    import seed
    db = SessionLocal()
    count = db.query(models.User).count()
    if count == 0:
        seed.seed_db()
    db.close()

check_and_seed()

app = FastAPI(title="Local Eats API", version="1.0.0")

# SECURITY SMELL: allow origins is "*" (not safe for prod, good for class discussion)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import restaurants, users

app.include_router(restaurants.router)
app.include_router(users.router)

# Mount static files (Frontend HTML/CSS/JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def redirect_to_index():
    # SMELL: instead of serving index at root, we awkwardly redirect
    return RedirectResponse(url="/static/index.html")
