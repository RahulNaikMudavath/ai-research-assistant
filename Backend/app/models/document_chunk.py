import uuid

from sqlalchemy import Column
from sqlalchemy import Text
from sqlalchemy import Integer
from sqlalchemy import ForeignKey

from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class DocumentChunk(Base):

    __tablename__ = "document_chunks"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id"),
        nullable=False
    )

    chunk_index = Column(
        Integer,
        nullable=False
    )

    chunk_text = Column(
        Text,
        nullable=False
    )