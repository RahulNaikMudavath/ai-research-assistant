from app.database.database import engine
from app.database.base import Base

from app.models.user import User
from app.models.user import User
from app.models.document import Document
from app.models.document_chunk import DocumentChunk


Base.metadata.create_all(bind=engine)

print("Tables Created Successfully")