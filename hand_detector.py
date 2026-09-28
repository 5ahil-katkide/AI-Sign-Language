"""
==========================================================
AI Sign Language Recognition System
MediaPipe Hand Detector
Author : Sahil Katkide
==========================================================
"""

import cv2
import mediapipe as mp

from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from config import (
    HAND_LANDMARKER_PATH,
    NUM_HANDS,
    MIN_HAND_DETECTION_CONFIDENCE,
    MIN_HAND_PRESENCE_CONFIDENCE,
    MIN_TRACKING_CONFIDENCE,
)


class HandDetector:

    def __init__(self):

        print("=" * 70)
        print("INITIALIZING MEDIAPIPE HAND DETECTOR")
        print("=" * 70)

        if not HAND_LANDMARKER_PATH.exists():

            raise FileNotFoundError(
                f"MediaPipe model not found:\n"
                f"{HAND_LANDMARKER_PATH}"
            )

        base_options = python.BaseOptions(
            model_asset_path=str(HAND_LANDMARKER_PATH)
        )

        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=NUM_HANDS,
            min_hand_detection_confidence=(
                MIN_HAND_DETECTION_CONFIDENCE
            ),
            min_hand_presence_confidence=(
                MIN_HAND_PRESENCE_CONFIDENCE
            ),
            min_tracking_confidence=(
                MIN_TRACKING_CONFIDENCE
            ),
        )

        self.detector = (
            vision.HandLandmarker
            .create_from_options(options)
        )

        print("MediaPipe HandLandmarker loaded.")
        print("Number of hands:", NUM_HANDS)
        print("=" * 70)


    # ======================================================
    # DETECT
    # ======================================================

    def detect(self, frame):

        if frame is None:

            return None

        if not hasattr(frame, "shape"):

            return None

        try:

            rgb = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2RGB
            )

            mp_image = mp.Image(
                image_format=mp.ImageFormat.SRGB,
                data=rgb
            )

            result = self.detector.detect(
                mp_image
            )

        except Exception as e:

            print(
                "MediaPipe detection error:",
                e
            )

            return None


        # ==================================================
        # NO HAND
        # ==================================================

        if (
            result is None
            or
            not result.hand_landmarks
        ):

            return None


        # ==================================================
        # FIRST HAND
        # ==================================================

        hand = result.hand_landmarks[0]


        # MediaPipe hand should contain 21 landmarks.

        if len(hand) != 21:

            print(
                "Unexpected landmark count:",
                len(hand)
            )

            return None


        # ==================================================
        # CREATE 63 FEATURES
        # ==================================================

        landmarks = []

        for landmark in hand:

            landmarks.extend([
                float(landmark.x),
                float(landmark.y),
                float(landmark.z)
            ])


        if len(landmarks) != 63:

            print(
                "Invalid feature count:",
                len(landmarks)
            )

            return None


        return {
            "landmarks": landmarks,
            "result": result
        }

    # 1