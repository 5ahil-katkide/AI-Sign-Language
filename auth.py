from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from database.database import get_db
from database.models import User
from database.schemas import RegisterSchema, LoginSchema
from database.security import hash_password, verify_password


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================================================
# JWT CONFIGURATION
# =========================================================

SECRET_KEY = "CHANGE_THIS_TO_A_RANDOM_SECRET_KEY"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================================================
# CREATE ACCESS TOKEN
# =========================================================

def create_access_token(data: dict):

    payload = data.copy()

    payload["exp"] = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# =========================================================
# GET CURRENT USER
# =========================================================

def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):

    try:

        # Remove "Bearer " from authorization header
        token = authorization.replace("Bearer ", "").strip()

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        if email is None:

            raise HTTPException(
                status_code=401,
                detail="Invalid Token"
            )

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Token Expired or Invalid"
        )

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="User Not Found"
        )

    return user


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
def register(
    user: RegisterSchema,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Check if email already exists
    # -----------------------------------------------------

    existing_email = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_email:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )


    # -----------------------------------------------------
    # Check if username already exists
    #
    # RegisterSchema uses "name"
    # Database User model uses "username"
    # Therefore use user.name here.
    # -----------------------------------------------------

    existing_username = db.query(User).filter(
        User.username == user.name
    ).first()

    if existing_username:

        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )


    # -----------------------------------------------------
    # Create new user
    # -----------------------------------------------------

    new_user = User(

        username=user.name,

        email=user.email,

        password=hash_password(
            user.password
        ),

        total_attempts=0,

        total_correct=0,

        accuracy=0.0,

        xp=0,

        level="Beginner"
    )


    # -----------------------------------------------------
    # Save user
    # -----------------------------------------------------

    try:

        db.add(new_user)

        db.commit()

        db.refresh(new_user)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Could not create user"
        )


    # -----------------------------------------------------
    # Registration response
    # -----------------------------------------------------

    return {

        "message": "Registration Successful",

        "user_id": new_user.id,

        "name": new_user.username,

        "username": new_user.username,

        "email": new_user.email

    }


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login(
    user: LoginSchema,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Find user by email
    # -----------------------------------------------------

    db_user = db.query(User).filter(
        User.email == user.email
    ).first()


    if db_user is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid Email"
        )


    # -----------------------------------------------------
    # Verify password
    # -----------------------------------------------------

    if not verify_password(
        user.password,
        db_user.password
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid Password"
        )


    # -----------------------------------------------------
    # Create JWT
    # -----------------------------------------------------

    token = create_access_token({

        "sub": db_user.email

    })


    # -----------------------------------------------------
    # Login response
    # -----------------------------------------------------

    return {

        "access_token": token,

        "token_type": "bearer",

        "user_id": db_user.id,

        "username": db_user.username,

        "name": db_user.username,

        "email": db_user.email,

        "xp": db_user.xp or 0,

        "level": db_user.level or "Beginner",

        "accuracy": db_user.accuracy or 0.0,

        "streak": 0,

        "total_attempts": db_user.total_attempts or 0,

        "total_correct": db_user.total_correct or 0

    }


# =========================================================
# PROFILE
# =========================================================

@router.get("/me")
def profile(
    current_user: User = Depends(get_current_user)
):

    return {

        "id": current_user.id,

        "username": current_user.username,

        "name": current_user.username,

        "email": current_user.email,

        "xp": current_user.xp or 0,

        "level": current_user.level or "Beginner",

        "accuracy": current_user.accuracy or 0.0,

        "streak": 0,

        "total_attempts": current_user.total_attempts or 0,

        "total_correct": current_user.total_correct or 0

    }