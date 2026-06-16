from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from fastapi import Depends

import shutil
import os

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.document import Document

from app.services.pdf_service import (
    extract_text_from_pdf
)

from app.auth.dependencies import (
    get_current_user
)

from app.models.user import User

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
    return {
        "document_id": str(document.id),
        "filename": document.filename,
        "uploaded_by":
        current_user.username
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
        return {"message": "Document not found"}

    return {
        "filename": document.filename,
        "text_preview":
            document.extracted_text[:1000]
            if document.extracted_text
            else None
    }