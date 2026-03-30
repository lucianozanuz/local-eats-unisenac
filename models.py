from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String) # Smell: Should literally never be named 'password', should be 'hashed_password'. Stored in plain text or simple hash.

    favorites = relationship("Favorite", back_populates="user")
    reviews = relationship("Review", back_populates="user")

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    cuisine_type = Column(String)
    location = Column(String)
    price_range = Column(Integer) # From 1 to 5 (e.g. $, $$, $$$)
    image_url = Column(String)

    # Smell: no pagination considerations, very heavy relationship loading by default
    menus = relationship("Menu", back_populates="restaurant")
    reviews = relationship("Review", back_populates="restaurant")
    favorited_by = relationship("Favorite", back_populates="restaurant")

class Menu(Base):
    __tablename__ = "menus"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    item_name = Column(String)
    price = Column(Float)
    description = Column(String)

    restaurant = relationship("Restaurant", back_populates="menus")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    rating = Column(Integer) # Smell: no constraint from 1 to 5 at DB level
    comment = Column(String)

    user = relationship("User", back_populates="reviews")
    restaurant = relationship("Restaurant", back_populates="reviews")

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))

    user = relationship("User", back_populates="favorites")
    restaurant = relationship("Restaurant", back_populates="favorited_by")
