from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import get_db

router = APIRouter(prefix="/restaurants", tags=["restaurants"])

@router.get("/", response_model=List[schemas.RestaurantResp])
def get_restaurants(
    db: Session = Depends(get_db), 
    cuisine: Optional[str] = None, 
    location: Optional[str] = None,
    price_range: Optional[int] = None
):
    # BIG CODE SMELL: We load EVERYTHING into memory and then filter with python lists.
    # Students should fix this to do db.query().filter()
    all_restaurants = db.query(models.Restaurant).all()
    
    result = []
    for r in all_restaurants:
        match = True
        if cuisine and cuisine.lower() not in r.cuisine_type.lower():
            match = False
        if location and location.lower() not in r.location.lower():
            match = False
        if price_range and price_range != r.price_range:
            match = False
            
        if match:
            result.append(r)
            
    return result

@router.get("/{restaurant_id}", response_model=schemas.RestaurantResp)
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    # CODE SMELL: Does not handle 'None' properly, if not found it will return a generic unhelpful internal server error during serialization or an empty body instead of 404.
    r = db.query(models.Restaurant).filter(models.Restaurant.id == restaurant_id).first()
    return r

@router.post("/{restaurant_id}/reviews", response_model=schemas.ReviewResp)
def add_review(
    restaurant_id: int, 
    review: schemas.ReviewCreate, 
    db: Session = Depends(get_db),
    user_id: str = Header(...) # Mock auth
):
    # SMELL: No validation if user_id exists or if restaurant exists
    new_review = models.Review(
        user_id=int(user_id),
        restaurant_id=restaurant_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review
