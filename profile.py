# =========================================================
# SIGN AI - PROFILE API
# =========================================================

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from database.models import User


# =========================================================
# PASSWORD UTILITIES
# =========================================================

try:
    from database.security import hash_password, verify_password
except ImportError:
    try:
        from security import hash_password, verify_password
    except ImportError:
        hash_password = None
        verify_password = None


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"]
)


# =========================================================
# REQUEST MODELS
# =========================================================

class ProfileUpdate(BaseModel):
    username: str
    mobile: str = ""


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


# =========================================================
# USER SERIALIZER
# =========================================================

def serialize_user(user: User):
    """
    Convert SQLAlchemy User object into JSON-safe data.
    """

    data = {
        "id": user.id,

        "username": user.username,

        "name": user.username,

        "email": user.email,

        "xp": getattr(user, "xp", 0) or 0,

        "level": getattr(
            user,
            "level",
            "Beginner"
        ) or "Beginner",

        "accuracy": float(
            getattr(
                user,
                "accuracy",
                0
            ) or 0
        ),

        "total_attempts": getattr(
            user,
            "total_attempts",
            0
        ) or 0,

        "total_correct": getattr(
            user,
            "total_correct",
            0
        ) or 0,

    }

    # =====================================================
    # MOBILE / PHONE COMPATIBILITY
    # =====================================================

    if hasattr(user, "mobile"):
        data["mobile"] = user.mobile or ""

    elif hasattr(user, "phone"):
        data["mobile"] = user.phone or ""

    else:
        data["mobile"] = ""

    return data


# =========================================================
# GET PROFILE
# =========================================================

@router.get("/{user_id}")
def get_profile(
    user_id: int,
    db: Session = Depends(get_db)
):

    print(
        f"[PROFILE] GET user={user_id}"
    )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "success": True,
        "user": serialize_user(user)
    }


# =========================================================
# UPDATE PROFILE
# =========================================================

@router.put("/{user_id}")
def update_profile(
    user_id: int,
    data: ProfileUpdate,
    db: Session = Depends(get_db)
):

    print(
        f"[PROFILE] UPDATE user={user_id}"
    )

    # =====================================================
    # FIND USER
    # =====================================================

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # =====================================================
    # CLEAN INPUT
    # =====================================================

    username = data.username.strip()
    mobile = data.mobile.strip()

    # =====================================================
    # VALIDATE USERNAME
    # =====================================================

    if not username:
        raise HTTPException(
            status_code=400,
            detail="Username cannot be empty"
        )

    if len(username) < 3:
        raise HTTPException(
            status_code=400,
            detail="Username must contain at least 3 characters"
        )

    # =====================================================
    # CHECK DUPLICATE USERNAME
    # =====================================================

    duplicate = (
        db.query(User)
        .filter(
            User.username == username,
            User.id != user_id
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    # =====================================================
    # UPDATE USERNAME
    # =====================================================

    user.username = username

    # =====================================================
    # UPDATE MOBILE
    # =====================================================

    if hasattr(user, "mobile"):
        user.mobile = mobile

    elif hasattr(user, "phone"):
        user.phone = mobile

    # =====================================================
    # SAVE DATABASE
    # =====================================================

    try:

        db.commit()

        db.refresh(user)

    except Exception as error:

        db.rollback()

        print(
            "[PROFILE] UPDATE ERROR:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Could not update profile"
        )

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "success": True,

        "message":
            "Profile updated successfully",

        "user":
            serialize_user(user)
    }


# =========================================================
# CHANGE PASSWORD
# =========================================================

@router.put("/{user_id}/password")
def change_password(
    user_id: int,
    data: PasswordUpdate,
    db: Session = Depends(get_db)
):

    print(
        f"[PROFILE] PASSWORD CHANGE user={user_id}"
    )

    # =====================================================
    # FIND USER
    # =====================================================

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # =====================================================
    # VALIDATE CURRENT PASSWORD
    # =====================================================

    if not data.current_password:
        raise HTTPException(
            status_code=400,
            detail="Current password is required"
        )

    # =====================================================
    # VALIDATE NEW PASSWORD
    # =====================================================

    if not data.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password is required"
        )

    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="New password must contain at least 8 characters"
        )

    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from the current password"
        )

    # =====================================================
    # CHECK SECURITY FUNCTIONS
    # =====================================================

    if (
        verify_password is None
        or hash_password is None
    ):
        raise HTTPException(
            status_code=500,
            detail=(
                "Password security functions are not configured. "
                "Connect profile.py to your existing password "
                "hashing module."
            )
        )

    # =====================================================
    # GET STORED PASSWORD
    # =====================================================

    stored_password = getattr(
        user,
        "password",
        None
    )

    if not stored_password:
        raise HTTPException(
            status_code=500,
            detail="User password is not configured correctly"
        )

    # =====================================================
    # VERIFY OLD PASSWORD
    # =====================================================

    try:

        valid = verify_password(
            data.current_password,
            stored_password
        )

    except Exception as error:

        print(
            "[PROFILE] VERIFY PASSWORD ERROR:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Password verification failed"
        )

    # =====================================================
    # WRONG PASSWORD
    # =====================================================

    if not valid:
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    # =====================================================
    # HASH NEW PASSWORD
    # =====================================================

    try:

        new_hash = hash_password(
            data.new_password
        )

        user.password = new_hash

        db.commit()

        db.refresh(user)

    except Exception as error:

        db.rollback()

        print(
            "[PROFILE] PASSWORD UPDATE ERROR:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Could not change password"
        )

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "success": True,
        "message": "Password changed successfully"
    }


# =========================================================
# PROFILE STATISTICS
# =========================================================

@router.get("/{user_id}/statistics")
def profile_statistics(
    user_id: int,
    db: Session = Depends(get_db)
):

    print(
        f"[PROFILE] STATISTICS user={user_id}"
    )

    # =====================================================
    # FIND USER
    # =====================================================

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # =====================================================
    # STATISTICS
    # =====================================================

    attempts = getattr(
        user,
        "total_attempts",
        0
    ) or 0

    correct = getattr(
        user,
        "total_correct",
        0
    ) or 0

    accuracy = getattr(
        user,
        "accuracy",
        0
    ) or 0

    xp = getattr(
        user,
        "xp",
        0
    ) or 0

    level = getattr(
        user,
        "level",
        "Beginner"
    ) or "Beginner"

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "success": True,

        "statistics": {

            "xp": xp,

            "level": level,

            "accuracy": float(
                accuracy
            ),

            "total_attempts": attempts,

            "total_correct": correct

        }
    }