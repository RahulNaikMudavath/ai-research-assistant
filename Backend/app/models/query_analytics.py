import uuid
from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.database.base import Base

class QueryAnalytics(Base):
    __tablename__ = "query_analytics"

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

    question = Column(
        String,
        nullable=False
    )

    prompt_tokens = Column(
        Integer,
        nullable=False,
        default=0
    )

    completion_tokens = Column(
        Integer,
        nullable=False,
        default=0
    )

    total_tokens = Column(
        Integer,
        nullable=False,
        default=0
    )

    estimated_cost = Column(
        Float,
        nullable=False,
        default=0.0
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
