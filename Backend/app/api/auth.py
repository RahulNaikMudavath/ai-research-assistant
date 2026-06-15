from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User

from app.schemas.user_schema import (
    UserRegister,
    UserLogin
)

from app.auth.security import (
    hash_password,
    verify_password
)

from app.auth.jwt_handler import (
    create_access_token
)

router = APIRouter()

@router.post("/register")
def register_user(
    user: UserRegister,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(
            user.password
        )
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User Registered"
    }

@router.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Credentials"
        )

    if not verify_password(
        user.password,
        db_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Credentials"
        )

    token = create_access_token(
        {"sub": str(db_user.id)}
    )

    return {
        "access_token": token
    }


from app.auth.dependencies import (
    get_current_user
)

@router.get("/me")
def current_user(
    user: User = Depends(
        get_current_user
    )
):

    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email
    }