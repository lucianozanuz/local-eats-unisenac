from typing import List, Optional
from pydantic import BaseModel

class MenuBase(BaseModel):
    item_name: str
    price: float
    description: str

class MenuCreate(MenuBase):
    pass

class MenuResp(MenuBase):
    id: int
    restaurant_id: int
    class Config:
        from_attributes = True

class ReviewBase(BaseModel):
    rating: int  # Smell: no validation (e.g. Field(ge=1, le=5))
    comment: str

class ReviewCreate(ReviewBase):
    restaurant_id: int

class ReviewResp(ReviewBase):
    id: int
    user_id: int
    restaurant_id: int
    class Config:
        from_attributes = True

class RestaurantBase(BaseModel):
    name: str
    description: str
    cuisine_type: str
    location: str
    price_range: int
    image_url: str

class RestaurantCreate(RestaurantBase):
    pass

class RestaurantResp(RestaurantBase):
    id: int
    menus: List[MenuResp] = []
    reviews: List[ReviewResp] = []
    class Config:
        from_attributes = True

class FavoriteResp(BaseModel):
    id: int
    user_id: int
    restaurant: RestaurantResp
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    password: str

class UserResp(UserBase):
    id: int
    password: str # MASSIVE SMELL / SECURITY BUG: password in return payload
    favorites: List[FavoriteResp] = []
    class Config:
        from_attributes = True

# Used for mock login
class UserLogin(BaseModel):
    email: str
    password: str

# --- Order Schemas ---
class OrderItemCreate(BaseModel):
    menu_id: int
    quantity: int

class OrderCreate(BaseModel):
    restaurant_id: int
    items: List[OrderItemCreate]

class OrderItemResp(BaseModel):
    id: int
    menu_id: int
    quantity: int
    price_at_time: float
    menu: MenuResp
    class Config:
        from_attributes = True

class OrderResp(BaseModel):
    id: int
    restaurant_id: int
    user_id: int
    status: str
    total_amount: float
    items: List[OrderItemResp] = []
    class Config:
        from_attributes = True
