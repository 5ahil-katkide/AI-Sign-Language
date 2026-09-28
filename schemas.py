from pydantic import BaseModel, EmailStr, Field, ConfigDict


# =========================================================
# REGISTER
# =========================================================

class RegisterSchema(BaseModel):
    name: str = Field(
        min_length=3,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=50
    )


# =========================================================
# LOGIN
# =========================================================

class LoginSchema(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=1,
        max_length=50
    )


# =========================================================
# USER RESPONSE
# =========================================================

class UserOut(BaseModel):

    id: int

    name: str = Field(
        validation_alias="username",
        serialization_alias="name"
    )

    email: EmailStr

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )