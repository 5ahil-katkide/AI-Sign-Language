from collections import Counter
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database.database import get_db
from database.models import User, PredictionHistory

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# ==========================================
# Dashboard Statistics
# ==========================================

@router.get("/stats")
def dashboard_stats(
    user_id: int,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    history = db.query(
        PredictionHistory
    ).filter(
        PredictionHistory.user_id == user_id
    ).all()

    total_predictions = len(history)

    if total_predictions == 0:

        average_confidence = 0

    else:

        average_confidence = round(

            sum(
                float(item.confidence)
                for item in history
            ) / total_predictions,

            2
        )

    # ------------------------
    # Level
    # ------------------------

    if total_predictions < 20:

        level = "Beginner"

    elif total_predictions < 100:

        level = "Intermediate"

    else:

        level = "Advanced"

    # ------------------------
    # Streak
    # ------------------------

    streak = 0

    today = datetime.utcnow().date()

    for i in range(365):

        day = today - timedelta(days=i)

        exists = db.query(
            PredictionHistory
        ).filter(

            PredictionHistory.user_id == user_id,

            func.date(
                PredictionHistory.created_at
            ) == day

        ).first()

        if exists:

            streak += 1

        else:

            break

    return {

        "accuracy": average_confidence,

        "total_predictions": total_predictions,

        "streak": streak,

        "level": level

    }


# ==========================================
# Prediction History
# ==========================================

@router.get("/history")
def prediction_history(
    user_id: int,
    db: Session = Depends(get_db)
):

    history = (

        db.query(PredictionHistory)

        .filter(
            PredictionHistory.user_id == user_id
        )

        .order_by(
            PredictionHistory.created_at.desc()
        )

        .limit(20)

        .all()

    )

    result = []

    for item in history:

        result.append({

            "prediction": item.prediction,

            "confidence": item.confidence,

            "date": item.created_at.strftime(
                "%d-%m-%Y %H:%M"
            )

        })

    return result


# ==========================================
# Weak Signs
# ==========================================

@router.get("/recommendations")
def recommendations(
    user_id: int,
    db: Session = Depends(get_db)
):

    history = db.query(
        PredictionHistory.prediction
    ).filter(

        PredictionHistory.user_id == user_id

    ).all()

    labels = [

        item.prediction

        for item in history

    ]

    counter = Counter(labels)

    weakest = [

        sign

        for sign, count

        in counter.most_common()

    ][-5:]

    return {

        "recommendations": weakest

    }


# ==========================================
# Weekly Chart
# ==========================================

@router.get("/chart")
def chart_data():

    return {

        "labels": [

            "Mon",

            "Tue",

            "Wed",

            "Thu",

            "Fri",

            "Sat",

            "Sun"

        ],

        "values": [

            5,

            8,

            6,

            12,

            10,

            9,

            15

        ]

    }