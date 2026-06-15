from app.database.database import engine
from app.database.base import Base

from app.models.user import User

Base.metadata.create_all(bind=engine)

print("Tables Created Successfully")