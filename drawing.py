"""
==========================================================
AI Sign Language Recognition System
Drawing Utilities
Author : Sahil Katkide
==========================================================
"""

import cv2

from config import (
    FONT,
    FONT_SCALE,
    FONT_THICKNESS,
    TEXT_COLOR,
    BOX_COLOR,
)


def draw_prediction(frame, prediction, confidence):
    """
    Draw prediction text on the frame.
    """

    text = f"Prediction : {prediction}"

    if confidence > 0:
        text += f" ({confidence*100:.1f}%)"

    # Background box
    cv2.rectangle(
        frame,
        (10, 10),
        (500, 60),
        BOX_COLOR,
        -1
    )

    # Prediction text
    cv2.putText(
        frame,
        text,
        (20, 45),
        FONT,
        FONT_SCALE,
        TEXT_COLOR,
        FONT_THICKNESS,
        cv2.LINE_AA
    )

    return frame