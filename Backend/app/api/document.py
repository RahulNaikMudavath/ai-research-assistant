from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from fastapi import Depends
from fastapi.responses import FileResponse

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
    add_embedding,
    save_index,
    chunk_metadata
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

    extracted_pages = None
    extracted_text = None

    if file.filename.lower().endswith(".pdf"):
        extracted_pages = extract_text_from_pdf(file_path)
        extracted_text = "\n".join([page_text for _, page_text in extracted_pages])

    document = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        extracted_text=extracted_text
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    if extracted_pages:
        global_chunk_idx = 0
        for page_num, page_text in extracted_pages:
            if not page_text.strip():
                continue
            
            page_chunks = chunk_text(page_text)
            
            for chunk in page_chunks:
                document_chunk = DocumentChunk(
                    document_id=document.id,
                    chunk_index=global_chunk_idx,
                    chunk_text=chunk,
                    page_number=page_num
                )
                db.add(document_chunk)

                embedding = create_embedding(chunk)
                add_embedding(
                    embedding,
                    {
                        "document_id": str(document.id),
                        "user_id": str(current_user.id),
                        "filename": document.filename,
                        "chunk_index": global_chunk_idx,
                        "chunk_text": chunk,
                        "page_number": page_num
                    }
                )
                global_chunk_idx += 1

        db.commit()
        save_index()

    return {
        "document_id": str(document.id),
        "filename": document.filename,
        "uploaded_by": current_user.username
    }


@router.get("/faiss-stats")
def faiss_stats(
    current_user: User = Depends(
        get_current_user
    )
):

    from app.rag.vector_store import chunk_metadata

    user_vectors = len([
        item for item in chunk_metadata
        if item.get("user_id") == str(current_user.id)
    ])

    return {
        "vectors": user_vectors
    }

@router.get("/{document_id}")
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
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
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not document:
        return {
            "message": "Document not found"
        }

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

@router.get("/")
def get_all_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    documents = db.query(
        Document
    ).filter(
        Document.user_id == current_user.id
    ).all()

    return [
        {
            "id": str(doc.id),
            "filename": doc.filename
        }
        for doc in documents
    ]


@router.get("/{document_id}/file")
def get_document_file(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not document:
        return {"message": "Document not found"}

    if not os.path.exists(document.file_path):
        return {"message": "File not found on disk"}

    return FileResponse(
        document.file_path,
        media_type="application/pdf",
        filename=document.filename
    )