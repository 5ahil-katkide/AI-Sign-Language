from datetime import datetime

import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database.database import get_db
from database.models import (
    PracticeAttempt,
    UserProgress,
    User
)


router = APIRouter(
    prefix="/practice",
    tags=["Practice"]
)


# =========================================================
# DIFFICULTY
# =========================================================

BEGINNER = list("ABCDEFGHI")

INTERMEDIATE = list("JKLMNOPQR")

ADVANCED = list("STUVWXYZ")


WORDS = {

    "easy": [
        "CAT",
        "DOG",
        "SUN",
        "BAT",
        "CAR",
        "MAP",
        "BOX",
        "PEN",
        "HAT",
        "CUP"
    ],

    "medium": [
        "APPLE",
        "HOUSE",
        "MONEY",
        "ORANGE",
        "BUTTON",
        "FLOWER",
        "MONKEY",
        "PYTHON",
        "FAMILY",
        "GARDEN"
    ],

    "hard": [
        "COMPUTER",
        "NOTEBOOK",
        "LANGUAGE",
        "RECOGNITION",
        "ALGORITHM",
        "ENGINEERING",
        "ARTIFICIAL",
        "INTELLIGENCE",
        "DEVELOPMENT",
        "PROGRAMMING"
    ]
}


# =========================================================
# RANDOM LETTER
# =========================================================

@router.get("/letter/{difficulty}")
def random_letter(difficulty: str):

    difficulty = difficulty.lower()

    if difficulty == "easy":

        letter = random.choice(BEGINNER)

    elif difficulty == "medium":

        letter = random.choice(INTERMEDIATE)

    elif difficulty == "hard":

        letter = random.choice(ADVANCED)

    else:

        return {
            "success": False,
            "message": "Invalid difficulty"
        }

    return {
        "success": True,
        "type": "letter",
        "difficulty": difficulty,
        "question": letter
    }


# =========================================================
# RANDOM WORD
# =========================================================

@router.get("/word/{difficulty}")
def random_word(difficulty: str):

    difficulty = difficulty.lower()

    if difficulty not in WORDS:

        return {
            "success": False,
            "message": "Invalid difficulty"
        }

    word = random.choice(
        WORDS[difficulty]
    )

    return {
        "success": True,
        "type": "word",
        "difficulty": difficulty,
        "question": word,
        "letters": list(word)
    }


# =========================================================
# MIXED PRACTICE
# =========================================================

@router.get("/mixed/{difficulty}")
def mixed_practice(difficulty: str):

    difficulty = difficulty.lower()

    if difficulty not in [
        "easy",
        "medium",
        "hard"
    ]:

        return {
            "success": False,
            "message": "Invalid difficulty"
        }

    if random.random() < 0.5:

        return random_letter(difficulty)

    return random_word(difficulty)


# =========================================================
# SAVE PRACTICE ATTEMPT
# =========================================================

@router.post("/attempt")
def save_practice_attempt(
    data: dict,
    db: Session = Depends(get_db)
):

    user_id = data.get("user_id")

    if user_id is None:

        raise HTTPException(
            status_code=400,
            detail="user_id is required"
        )

    try:

        user_id = int(user_id)

    except (ValueError, TypeError):

        raise HTTPException(
            status_code=400,
            detail="Invalid user_id"
        )

    # -----------------------------------------------------
    # CHECK USER
    # -----------------------------------------------------

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # -----------------------------------------------------
    # GET DATA
    # -----------------------------------------------------

    target = str(
        data.get("target", "")
    ).strip()

    prediction = str(
        data.get("prediction", "")
    ).strip()

    confidence = float(
        data.get("confidence", 0)
    )

    difficulty = str(
        data.get(
            "difficulty",
            "easy"
        )
    ).lower()

    practice_type = str(
        data.get(
            "practice_type",
            "letter"
        )
    )

    feedback = data.get(
        "feedback"
    )

    # -----------------------------------------------------
    # VALIDATION
    # -----------------------------------------------------

    if not target:

        raise HTTPException(
            status_code=400,
            detail="Target is required"
        )

    if not prediction:

        raise HTTPException(
            status_code=400,
            detail="Prediction is required"
        )

    # Keep confidence inside valid range
    confidence = max(
        0,
        min(
            confidence,
            100
        )
    )

    # -----------------------------------------------------
    # CHECK ANSWER
    # -----------------------------------------------------

    correct = (
        target.lower().strip()
        ==
        prediction.lower().strip()
    )

    # -----------------------------------------------------
    # CREATE ATTEMPT
    # -----------------------------------------------------

    attempt = PracticeAttempt(

        user_id=user_id,

        target=target,

        prediction=prediction,

        confidence=round(
            confidence,
            2
        ),

        difficulty=difficulty,

        correct=correct,

        practice_type=practice_type,

        feedback=feedback,

        timestamp=datetime.utcnow()
    )

    db.add(attempt)

    # -----------------------------------------------------
    # GET / CREATE PROGRESS
    # -----------------------------------------------------

    progress = db.query(
        UserProgress
    ).filter(
        UserProgress.user_id == user_id
    ).first()

    if not progress:

        progress = UserProgress(

            user_id=user_id,

            xp=0,

            level="Beginner",

            streak=0,

            best_accuracy=0,

            sessions=0
        )

        db.add(progress)

        db.flush()

    # -----------------------------------------------------
    # XP
    # -----------------------------------------------------

    if correct:

        xp_gain = {

            "easy": 10,

            "medium": 15,

            "hard": 25

        }.get(
            difficulty,
            10
        )

        progress.xp += xp_gain

    # -----------------------------------------------------
    # LEVEL
    # -----------------------------------------------------

    if progress.xp >= 1000:

        progress.level = "Advanced"

    elif progress.xp >= 500:

        progress.level = "Intermediate"

    else:

        progress.level = "Beginner"

    # -----------------------------------------------------
    # UPDATE SESSIONS
    # -----------------------------------------------------

    progress.sessions += 1

    # -----------------------------------------------------
    # CALCULATE CURRENT ACCURACY
    # -----------------------------------------------------

    total_attempts = db.query(
        PracticeAttempt
    ).filter(
        PracticeAttempt.user_id == user_id
    ).count()

    correct_attempts = db.query(
        PracticeAttempt
    ).filter(
        PracticeAttempt.user_id == user_id,
        PracticeAttempt.correct.is_(True)
    ).count()

    accuracy = (

        correct_attempts /
        total_attempts *
        100

    ) if total_attempts > 0 else 0

    # -----------------------------------------------------
    # BEST ACCURACY
    # -----------------------------------------------------

    if accuracy > progress.best_accuracy:

        progress.best_accuracy = round(
            accuracy,
            1
        )

    db.commit()

    db.refresh(attempt)

    db.refresh(progress)

    return {

        "success": True,

        "attempt_id": attempt.id,

        "correct": correct,

        "target": target,

        "prediction": prediction,

        "confidence": round(
            confidence,
            2
        ),

        "xp": progress.xp,

        "level": progress.level,

        "accuracy": round(
            accuracy,
            1
        )
    }


# =========================================================
# USER PROGRESS
# =========================================================

@router.get("/progress/{user_id}")
def get_practice_progress(
    user_id: int,
    db: Session = Depends(get_db)
):

    records = db.query(
        PracticeAttempt
    ).filter(
        PracticeAttempt.user_id == user_id
    ).order_by(
        PracticeAttempt.timestamp.asc()
    ).all()

    progress = db.query(
        UserProgress
    ).filter(
        UserProgress.user_id == user_id
    ).first()

    if not progress:

        progress = UserProgress(
            user_id=user_id,
            xp=0,
            level="Beginner",
            streak=0,
            best_accuracy=0,
            sessions=0
        )

    # -----------------------------------------------------
    # NO RECORDS
    # -----------------------------------------------------

    if not records:

        return {

            "success": True,

            "attempts": 0,

            "correct": 0,

            "accuracy": 0,

            "xp": progress.xp,

            "level": progress.level,

            "weak_sign": None,

            "strong_sign": None,

            "improvement": 0
        }

    # -----------------------------------------------------
    # GENERAL STATISTICS
    # -----------------------------------------------------

    attempts = len(records)

    correct = sum(
        1
        for r in records
        if r.correct
    )

    accuracy = (
        correct /
        attempts *
        100
    )

    # -----------------------------------------------------
    # SIGN STATISTICS
    # -----------------------------------------------------

    sign_stats = {}

    for record in records:

        sign = record.target

        if sign not in sign_stats:

            sign_stats[sign] = {
                "attempts": 0,
                "correct": 0
            }

        sign_stats[sign]["attempts"] += 1

        if record.correct:

            sign_stats[sign]["correct"] += 1

    sign_accuracy = {}

    for sign, stats in sign_stats.items():

        sign_accuracy[sign] = (

            stats["correct"] /
            stats["attempts"] *
            100

        )

    weak_sign = None

    strong_sign = None

    if sign_accuracy:

        weak_sign = min(
            sign_accuracy,
            key=sign_accuracy.get
        )

        strong_sign = max(
            sign_accuracy,
            key=sign_accuracy.get
        )

    # -----------------------------------------------------
    # IMPROVEMENT
    # -----------------------------------------------------

    improvement = 0

    if len(records) >= 10:

        first_records = records[:10]

        recent_records = records[-10:]

        first_correct = sum(
            1
            for r in first_records
            if r.correct
        )

        recent_correct = sum(
            1
            for r in recent_records
            if r.correct
        )

        first_accuracy = (
            first_correct /
            len(first_records) *
            100
        )

        recent_accuracy = (
            recent_correct /
            len(recent_records) *
            100
        )

        improvement = (
            recent_accuracy -
            first_accuracy
        )

    return {

        "success": True,

        "attempts": attempts,

        "correct": correct,

        "accuracy": round(
            accuracy,
            1
        ),

        "xp": progress.xp,

        "level": progress.level,

        "weak_sign": weak_sign,

        "strong_sign": strong_sign,

        "improvement": round(
            improvement,
            1
        )
    }


# =========================================================
# AI COACH RECOMMENDATION
# =========================================================

@router.get("/recommendation/{user_id}")
def get_practice_recommendation(
    user_id: int,
    db: Session = Depends(get_db)
):

    records = db.query(
        PracticeAttempt
    ).filter(
        PracticeAttempt.user_id == user_id
    ).order_by(
        PracticeAttempt.timestamp.asc()
    ).all()

    if len(records) < 3:

        return {

            "success": True,

            "recommendation":
                "Start practicing. I will analyze your performance after a few attempts."
        }

    attempts = len(records)

    correct = sum(
        1
        for r in records
        if r.correct
    )

    accuracy = (
        correct /
        attempts *
        100
    )

    # -----------------------------------------------------
    # SIGN PERFORMANCE
    # -----------------------------------------------------

    sign_stats = {}

    for record in records:

        sign = record.target

        if sign not in sign_stats:

            sign_stats[sign] = {
                "attempts": 0,
                "correct": 0
            }

        sign_stats[sign]["attempts"] += 1

        if record.correct:

            sign_stats[sign]["correct"] += 1

    weakest = None

    weakest_accuracy = 101

    for sign, stats in sign_stats.items():

        if stats["attempts"] < 2:

            continue

        sign_acc = (
            stats["correct"] /
            stats["attempts"] *
            100
        )

        if sign_acc < weakest_accuracy:

            weakest_accuracy = sign_acc

            weakest = sign

    # -----------------------------------------------------
    # RECOMMENDATION
    # -----------------------------------------------------

    if weakest and weakest_accuracy < 60:

        recommendation = (

            f"🎯 Focus on sign '{weakest}'. "

            f"Your current accuracy is "
            f"{weakest_accuracy:.0f}%. "

            f"Practice it slowly and carefully."
        )

    elif accuracy >= 85:

        recommendation = (

            "🚀 Excellent performance! "

            "Your accuracy is above 85%. "

            "You are ready for a higher difficulty level."
        )

    elif accuracy >= 70:

        recommendation = (

            "📈 Good progress! "

            "Keep practicing the current difficulty "
            "and focus on consistency."
        )

    else:

        recommendation = (

            "💡 Keep practicing. "

            "Focus on making your hand position stable "
            "and hold each sign clearly."
        )

    return {

        "success": True,

        "recommendation": recommendation
    }


# =========================================================
# RECOMMENDED DIFFICULTY
# =========================================================

@router.get("/recommended-difficulty/{user_id}")
def recommended_difficulty(
    user_id: int,
    db: Session = Depends(get_db)
):

    records = db.query(
        PracticeAttempt
    ).filter(
        PracticeAttempt.user_id == user_id
    ).order_by(
        PracticeAttempt.timestamp.desc()
    ).limit(10).all()

    if len(records) < 10:

        return {

            "success": True,

            "difficulty": "easy",

            "message": "Keep practicing Easy level."
        }

    correct = sum(
        1
        for r in records
        if r.correct
    )

    accuracy = (
        correct /
        len(records) *
        100
    )

    if accuracy >= 85:

        difficulty = "hard"

    elif accuracy >= 75:

        difficulty = "medium"

    else:

        difficulty = "easy"

    return {

        "success": True,

        "difficulty": difficulty,

        "accuracy": round(
            accuracy,
            1
        )
    }