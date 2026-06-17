from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from fastapi import Depends

import shutil
import os

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.user import User

from app.auth.dependencies import (
    get_current_user
)

from app.services.pdf_service import (
    extract_text_from_pdf
)

from app.services.chunk_service import (
    chunk_text
)

from app.services.embedding_service import (
    create_embedding
)

from app.rag.vector_store import (
    add_embedding
)

router = APIRouter()


@router.post("/upload")
def upload_document(

    file: UploadFile = File(...),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    upload_dir = "uploads"

    os.makedirs(
        upload_dir,
        exist_ok=True
    )

    file_path = os.path.join(
        upload_dir,
        file.filename
    )

    with open(
        file_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    extracted_text = None

    if file.filename.lower().endswith(".pdf"):

        extracted_text = extract_text_from_pdf(
            file_path
        )

    document = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        extracted_text=extracted_text
    )

    db.add(document)

    db.commit()

    db.refresh(document)

    if extracted_text:

        chunks = chunk_text(
            extracted_text
        )

        for index, chunk in enumerate(chunks):

            document_chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=index,
                chunk_text=chunk
            )

            db.add(document_chunk)

            embedding = create_embedding(
                chunk
            )

            add_embedding(
                embedding,
                {
                    "document_id": str(document.id),
                    "chunk_index": index,
                    "chunk_text": chunk
                }
            )

        db.commit()

    return {
        "document_id": str(document.id),
        "filename": document.filename,
        "uploaded_by": current_user.username
    }


@router.get("/faiss-stats")
def faiss_stats():

    from app.rag.vector_store import index

    return {
        "vectors": index.ntotal
    }


@router.get("/{document_id}")
def get_document(
    document_id: str,
    db: Session = Depends(get_db)
):

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:

        return {
            "message": "Document not found"
        }

    return {
        "filename": document.filename,
        "text_preview":
            document.extracted_text[:1000]
            if document.extracted_text
            else None
    }


@router.get("/{document_id}/chunks")
def get_document_chunks(
    document_id: str,
    db: Session = Depends(get_db)
):

    chunks = db.query(
        DocumentChunk
    ).filter(
        DocumentChunk.document_id == document_id
    ).all()

    return {
        "total_chunks": len(chunks),
        "chunks": [
            {
                "index": chunk.chunk_index,
                "preview": chunk.chunk_text[:200]
            }
            for chunk in chunks
        ]
    }