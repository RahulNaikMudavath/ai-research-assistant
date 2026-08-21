from app.database.database import engine
from app.database.base import Base

from app.models.user import User
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.chat_share import ChatShare
from app.models.query_analytics import QueryAnalytics


Base.metadata.create_all(bind=engine)

print("Tables Created Successfully")