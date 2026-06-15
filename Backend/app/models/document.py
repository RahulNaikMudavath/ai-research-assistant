import uuid

from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey

from sqlalchemy.dialects.postgresql import UUID

from datetime import datetime

from app.database.base import Base
from fastapi import APIRouter


class Document(Base):

    __tablename__ = "documents"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    filename = Column(
        String,
        nullable=False
    )

    file_path = Column(
        String,
        nullable=False
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )


router = APIRouter()

@router.get("/test")
def test_document():

    return {
        "message": "Document API Working"
    }