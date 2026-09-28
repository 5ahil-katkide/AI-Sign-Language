"""
==========================================================
AI Sign Language Recognition System
Configuration
Author : Sahil Katkide
==========================================================
"""

from pathlib import Path


# ==========================================================
# PROJECT DIRECTORIES
# ==========================================================

ROOT_DIR = Path(__file__).resolve().parent

MODELS_DIR = ROOT_DIR / "models"


# ==========================================================
# MODEL FILES
# ==========================================================

MODEL_PATH = MODELS_DIR / "random_forest_model.pkl"

LABEL_ENCODER_PATH = MODELS_DIR / "label_encoder.pkl"

HAND_LANDMARKER_PATH = MODELS_DIR / "hand_landmarker.task"


# ==========================================================
# CAMERA
# ==========================================================

CAMERA_INDEX = 0

CAMERA_WIDTH = 1280

CAMERA_HEIGHT = 720

FPS = 30


# ==========================================================
# MEDIAPIPE
# ==========================================================

NUM_HANDS = 1

MIN_HAND_DETECTION_CONFIDENCE = 0.50

MIN_HAND_PRESENCE_CONFIDENCE = 0.50

MIN_TRACKING_CONFIDENCE = 0.50


# ==========================================================
# PREDICTION
# ==========================================================

CONFIDENCE_THRESHOLD = 0.80

UNKNOWN_LABEL = "Nothing"


# ==========================================================
# DRAWING
# ==========================================================

LANDMARK_COLOR = (0, 255, 0)

CONNECTION_COLOR = (255, 255, 255)

TEXT_COLOR = (255, 255, 255)

BOX_COLOR = (45, 45, 45)

SUCCESS_COLOR = (0, 255, 0)

WARNING_COLOR = (0, 255, 255)

ERROR_COLOR = (0, 0, 255)


# ==========================================================
# OPENCV WINDOW
# ==========================================================

WINDOW_NAME = "AI Sign Language Recognition"

WINDOW_WIDTH = 1400

WINDOW_HEIGHT = 850


# ==========================================================
# FONT
# ==========================================================

FONT = 0

FONT_SCALE = 1

FONT_THICKNESS = 2


# ==========================================================
# API
# ==========================================================

HOST = "127.0.0.1"

PORT = 8000


# ==========================================================
# CLASS NAMES
# ==========================================================

CLASS_NAMES = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
    "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
    "U", "V", "W", "X", "Y", "Z",
    "del",
    "space"
]

# 1