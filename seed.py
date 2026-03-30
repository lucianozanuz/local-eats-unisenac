import random
from database import engine, SessionLocal
import models

def seed_db():
    print("Dropping all tables to reset state...")
    models.Base.metadata.drop_all(bind=engine)
    print("Recreating tables...")
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Create some mock users
    users = [
        models.User(name="Admin", email="admin@localeats.com", password="admin"), # CODE SMELL: plain text password
        models.User(name="User Teste", email="teste@teste.com", password="123")
    ]
    db.add_all(users)
    db.commit()

    # Create Restaurants
    cuisines = ["Italiana", "Japonesa", "Brasileira", "Mexicana", "Hambúrguer", "Saudável"]
    img_urls = [
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800"
    ]
    
    restaurants = []
    for i in range(15):
        r = models.Restaurant(
            name=f"Restaurante Sabor {i}",
            description=f"Um ótimo lugar para experimentar comida autêntica na sua região. Fundado em 202{i%4}.",
            cuisine_type=random.choice(cuisines),
            location=random.choice(["Centro", "Zona Sul", "Zona Norte", "Bairro Nobre"]),
            price_range=random.randint(1, 4),
            image_url=random.choice(img_urls)
        )
        restaurants.append(r)
    
    db.add_all(restaurants)
    db.commit()

    # Create Menus for each restaurant
    for r in restaurants:
        for j in range(random.randint(2, 5)):
            m = models.Menu(
                restaurant_id=r.id,
                item_name=f"Prato Especial {j}",
                price=random.uniform(15.0, 95.0),
                description="Delicioso prato preparado com ingredientes frescos e selecionados."
            )
            db.add(m)
            
        r_rev = models.Review(
            user_id=1,
            restaurant_id=r.id,
            rating=random.randint(3, 5),
            comment="Muito bom, recomendo fortemente!"
        )
        db.add(r_rev)
    
    db.commit()
    print("Database seeded with sample data.")
    db.close()

if __name__ == "__main__":
    seed_db()
