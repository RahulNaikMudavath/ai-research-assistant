from pydantic import BaseModel
from pydantic import EmailStr

class UserRegister(BaseModel):

    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):

    email: EmailStr
    password: str