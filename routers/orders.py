from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/", response_model=schemas.OrderResp)
def create_order(
    order_data: schemas.OrderCreate, 
    db: Session = Depends(get_db),
    user_id: str = Header(...)
):
    # Verify restaurant exists
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == order_data.restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    total_amount = 0.0
    new_order = models.Order(
        user_id=int(user_id),
        restaurant_id=order_data.restaurant_id,
        status="PENDING"
    )
    db.add(new_order)
    db.flush() # get new_order.id

    for item in order_data.items:
        menu_item = db.query(models.Menu).filter(
            models.Menu.id == item.menu_id, 
            models.Menu.restaurant_id == order_data.restaurant_id
        ).first()

        if not menu_item:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Menu item {item.menu_id} not found in this restaurant")
        
        if item.quantity <= 0:
            db.rollback()
            raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

        order_item = models.OrderItem(
            order_id=new_order.id,
            menu_id=menu_item.id,
            quantity=item.quantity,
            price_at_time=menu_item.price
        )
        db.add(order_item)
        total_amount += (menu_item.price * item.quantity)
    
    new_order.total_amount = total_amount
    db.commit()
    db.refresh(new_order)
    
    return new_order

@router.get("/", response_model=List[schemas.OrderResp])
def get_orders(user_id: str = Header(...), db: Session = Depends(get_db)):
    orders = db.query(models.Order).filter(models.Order.user_id == int(user_id)).all()
    return orders
