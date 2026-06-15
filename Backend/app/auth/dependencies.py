from fastapi import Depends
from fastapi import HTTPException

from fastapi.security import HTTPBearer
from fastapi.security import HTTPAuthorizationCredentials

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.user import User

from app.auth.jwt_handler import verify_token

security = HTTPBearer()

def get_current_user(

    credentials:
    HTTPAuthorizationCredentials
    = Depends(security),

    db: Session = Depends(get_db)

):

    token = credentials.credentials

    payload = verify_token(token)

    if not payload:

        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )

    user_id = payload.get("sub")

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User Not Found"
        )

    return user