from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import models, schemas
from database import get_db

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", response_model=schemas.UserResp)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Very basic validation
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Smell: password not hashed
    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        password=user_data.password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    # SMELL: Simple text comparison for password, mock login logic
    user = db.query(models.User).filter(
        models.User.email == user_data.email, 
        models.User.password == user_data.password
    ).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Return user with ID to be used as token
    return {"user_id": user.id, "name": user.name}

@router.get("/me", response_model=schemas.UserResp)
def get_me(user_id: str = Header(...), db: Session = Depends(get_db)):
    # Very insecure mock auth
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/favorites/{restaurant_id}")
def add_favorite(
    restaurant_id: int, 
    user_id: str = Header(...), 
    db: Session = Depends(get_db)
):
    # Check if exists
    existing = db.query(models.Favorite).filter(
        models.Favorite.user_id == int(user_id),
        models.Favorite.restaurant_id == restaurant_id
    ).first()
    
    if existing:
        # BUG: Retorna sucesso sem fazer nada real invés de erro amigável se já existir
        return {"msg": "Already in favorites"}
        
    fav = models.Favorite(user_id=int(user_id), restaurant_id=restaurant_id)
    db.add(fav)
    db.commit()
    return {"msg": "Added to favorites"}

@router.delete("/favorites/{restaurant_id}")
def remove_favorite(
    restaurant_id: int, 
    user_id: str = Header(...), 
    db: Session = Depends(get_db)
):
    db.query(models.Favorite).filter(
        models.Favorite.user_id == int(user_id),
        models.Favorite.restaurant_id == restaurant_id
    ).delete()
    db.commit()
    return {"msg": "Removed from favorites"}
