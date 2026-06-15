from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from fastapi import Depends

import shutil
import os

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.document import Document

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

    document = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path
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