"""
==========================================================
AI Sign Language Recognition System
Prediction API
Author : Sahil Katkide
==========================================================
"""

from typing import Optional

import cv2
import numpy as np

from fastapi import (
    APIRouter,
    File,
    Form,
    UploadFile,
    HTTPException,
)



from vision.hand_detector import HandDetector
from vision.predictor import Predictor

# ==========================================================
# ROUTER
# ==========================================================

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Prediction"]
)


# ==========================================================
# LOAD AI COMPONENTS ONCE
# ==========================================================

hand_detector = HandDetector()

predictor = Predictor()


# ==========================================================
# PREDICT
# ==========================================================

@router.post("/predict")
async def predict_sign(
    file: UploadFile = File(...),
    target: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
):

    # ======================================================
    # VALIDATE FILE
    # ======================================================

    if file is None:

        raise HTTPException(
            status_code=400,
            detail="Image file is required."
        )


    # ======================================================
    # READ IMAGE
    # ======================================================

    try:

        image_bytes = await file.read()

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=f"Unable to read uploaded image: {e}"
        )


    if not image_bytes:

        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )


    # ======================================================
    # DECODE IMAGE
    # ======================================================

    try:

        image_array = np.frombuffer(
            image_bytes,
            dtype=np.uint8
        )

        frame = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR
        )

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=f"Unable to decode image: {e}"
        )


    if frame is None:

        raise HTTPException(
            status_code=400,
            detail="Invalid image."
        )


    print()
    print("=" * 70)
    print("AI PREDICTION REQUEST")
    print("=" * 70)

    print(
        "Image shape:",
        frame.shape
    )

    print(
        "Target:",
        target
    )

    print(
        "User ID:",
        user_id
    )


    # ======================================================
    # DETECT HAND
    # ======================================================

    detection = hand_detector.detect(
        frame
    )


    if detection is None:

        print(
            "No hand detected."
        )

        return {

            "success":
                False,

            "prediction":
                "Nothing",

            "label":
                "Nothing",

            "confidence":
                0,

            "is_correct":
                False,

            "target":
                target,

            "message":
                "No hand detected. "
                "Place your hand clearly inside the camera frame.",

            "top_predictions":
                []

        }


    # ======================================================
    # LANDMARKS
    # ======================================================

    landmarks = detection[
        "landmarks"
    ]


    if len(landmarks) != 63:

        raise HTTPException(
            status_code=500,
            detail=(
                "Invalid landmark count. "
                f"Expected 63, received {len(landmarks)}."
            )
        )


    print(
        "Detected landmarks:",
        len(landmarks)
    )


    # ======================================================
    # PREDICTION
    # ======================================================

    try:

        result = predictor.predict(
            landmarks
        )

    except Exception as e:

        print(
            "Prediction error:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {e}"
        )


    prediction = result.get(
        "prediction",
        "Nothing"
    )

    confidence = float(
        result.get(
            "confidence",
            0
        )
    )


    # ======================================================
    # TARGET COMPARISON
    # ======================================================

    is_correct = False


    if target:

        is_correct = (
            prediction.strip().lower()
            ==
            target.strip().lower()
        )


    # ======================================================
    # MESSAGE
    # ======================================================

    if prediction == "Nothing":

        message = (
            "No recognizable sign detected."
        )

    elif is_correct:

        message = (
            f"Correct! You made the "
            f"{target} sign."
        )

    elif target:

        message = (
            f"Detected {prediction}. "
            f"Try making the {target} sign again."
        )

    else:

        message = (
            f"Detected sign: {prediction}"
        )


    # ======================================================
    # RESPONSE
    # ======================================================

    response = {

        "success":
            True,

        "prediction":
            prediction,

        "label":
            prediction,

        "confidence":
            confidence,

        "is_correct":
            is_correct,

        "target":
            target,

        "message":
            message,

        "top_predictions":
            result.get(
                "top_predictions",
                []
            )

    }


    print(
        "Final response:",
        response
    )

    print("=" * 70)


    return response

# 1