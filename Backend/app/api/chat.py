from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.schemas.chat import ChatRequest
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.chat_share import ChatShare
from app.models.query_analytics import QueryAnalytics
from sqlalchemy import func

from app.services.retrieval_service import (
    retrieve_relevant_chunks
)

from app.services.llm_service import (
    generate_answer
)

router = APIRouter()


class ChatShareRequest(BaseModel):
    title: str
    messages: List[Dict[str, Any]]


@router.post("/ask")
def ask_question(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    chunks = retrieve_relevant_chunks(
        request.question,
        request.document_id,
        str(current_user.id)
    )

    context = "\n\n".join(
        [
            f"Source: {chunk['filename']}\n{chunk['chunk_text']}"
            for chunk in chunks
        ]
    )

    answer_data = generate_answer(
        request.question,
        context
    )
    
    answer = answer_data["text"]
    usage = answer_data["usage"]

    # Save to query analytics database table
    analytics_record = QueryAnalytics(
        user_id=current_user.id,
        question=request.question,
        prompt_tokens=usage["prompt_tokens"],
        completion_tokens=usage["completion_tokens"],
        total_tokens=usage["total_tokens"],
        estimated_cost=usage["estimated_cost"]
    )
    db.add(analytics_record)
    db.commit()

    return {
        "question": request.question,
        "answer": answer,
        "sources": [
            {
                "filename": item["filename"],
                "chunk_index": item["chunk_index"],
                "preview": item["chunk_text"][:200],
                "page_number": item.get("page_number"),
                "score": item.get("score"),
                "distance": item.get("distance")
            }
            for item in chunks
        ],
        "usage": usage
    }


@router.get("/analytics")
def get_query_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stats = db.query(
        func.sum(QueryAnalytics.prompt_tokens).label("total_prompt_tokens"),
        func.sum(QueryAnalytics.completion_tokens).label("total_completion_tokens"),
        func.sum(QueryAnalytics.total_tokens).label("total_total_tokens"),
        func.sum(QueryAnalytics.estimated_cost).label("total_estimated_cost"),
        func.count(QueryAnalytics.id).label("total_queries")
    ).filter(QueryAnalytics.user_id == current_user.id).first()

    return {
        "total_prompt_tokens": stats.total_prompt_tokens or 0,
        "total_completion_tokens": stats.total_completion_tokens or 0,
        "total_tokens": stats.total_total_tokens or 0,
        "total_estimated_cost": round(stats.total_estimated_cost or 0.0, 6),
        "total_queries": stats.total_queries or 0
    }


@router.post("/share")
def share_chat(
    request: ChatShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    share = ChatShare(
        title=request.title,
        messages=request.messages
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    
    return {
        "share_id": str(share.id)
    }


@router.get("/share/{share_id}")
def get_shared_chat(
    share_id: str,
    db: Session = Depends(get_db)
):
    share = db.query(ChatShare).filter(ChatShare.id == share_id).first()
    if not share:
        raise HTTPException(status_code=404, detail="Shared chat session not found")
        
    return {
        "title": share.title,
        "messages": share.messages,
        "created_at": share.created_at
    }