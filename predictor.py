"""
AI Sign Language Recognition System
Random Forest Predictor
Author : Sahil Katkide
"""

import joblib
import numpy as np

from config import MODEL_PATH, LABEL_ENCODER_PATH


class Predictor:

    def __init__(self):
        print()
        print("=" * 70)
        print("SIGN LANGUAGE PREDICTOR")
        print("=" * 70)

        # ==================================================
        # CHECK FILES
        # ==================================================

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Random Forest model not found:\n{MODEL_PATH}"
            )

        if not LABEL_ENCODER_PATH.exists():
            raise FileNotFoundError(
                f"Label encoder not found:\n{LABEL_ENCODER_PATH}"
            )

        # ==================================================
        # LOAD MODEL
        # ==================================================

        print("Loading model:", MODEL_PATH)

        self.model = joblib.load(MODEL_PATH)

        print("Model:", type(self.model).__name__)

        # ==================================================
        # LOAD LABEL ENCODER
        # ==================================================

        print("Loading label encoder:", LABEL_ENCODER_PATH)

        self.label_encoder = joblib.load(LABEL_ENCODER_PATH)

        print("Encoder:", type(self.label_encoder).__name__)

        # ==================================================
        # MODEL INFO
        # ==================================================

        self.expected_features = getattr(
            self.model,
            "n_features_in_",
            None
        )

        self.model_classes = getattr(
            self.model,
            "classes_",
            None
        )

        print("Expected features:", self.expected_features)
        print("Model classes:", self.model_classes)

        # ==================================================
        # LABEL INFO
        # ==================================================

        self.label_classes = np.asarray(
            self.label_encoder.classes_
        )

        print("Label classes:", self.label_classes)
        print("Number of labels:", len(self.label_classes))

        # ==================================================
        # VALIDATION
        # ==================================================

        if len(self.label_classes) == 0:
            raise ValueError(
                "LabelEncoder contains no classes."
            )

        if self.expected_features is not None:

            if self.expected_features != 63:
                print(
                    "WARNING: "
                    f"Model expects {self.expected_features} "
                    "features, not 63."
                )

        print("=" * 70)
        print("Predictor initialized successfully.")
        print("=" * 70)
        print()

    # ======================================================
    # PREPARE FEATURES
    # ======================================================

    def _prepare_features(self, landmarks):

        if landmarks is None:
            raise ValueError(
                "Landmarks are None."
            )

        array = np.asarray(
            landmarks,
            dtype=np.float32
        )

        # --------------------------------------------------
        # 21 x 3
        # --------------------------------------------------

        if array.ndim == 2:

            if array.shape != (21, 3):
                raise ValueError(
                    "Expected landmarks with shape "
                    f"(21, 3), got {array.shape}"
                )

            features = array.reshape(-1)

        # --------------------------------------------------
        # 63
        # --------------------------------------------------

        elif array.ndim == 1:

            features = array.reshape(-1)

        else:

            raise ValueError(
                f"Unsupported landmark shape: {array.shape}"
            )

        # ==================================================
        # EXACT FEATURE COUNT
        # ==================================================

        if len(features) != 63:
            raise ValueError(
                "Expected exactly 63 MediaPipe features, "
                f"received {len(features)}."
            )

        # ==================================================
        # FINITE VALUES
        # ==================================================

        if not np.all(
            np.isfinite(features)
        ):
            raise ValueError(
                "Landmarks contain NaN or infinite values."
            )

        return features.astype(
            np.float32
        )

    # ======================================================
    # DECODE MODEL CLASS
    # ======================================================

    def _decode_class(self, model_class):

        # --------------------------------------------------
        # STRING CLASS
        # --------------------------------------------------

        if isinstance(
            model_class,
            (str, np.str_)
        ):
            return str(model_class)

        # --------------------------------------------------
        # NUMERIC CLASS
        # --------------------------------------------------

        try:

            class_id = int(
                model_class
            )

        except Exception:

            raise ValueError(
                f"Unable to decode model class: "
                f"{model_class}"
            )

        # --------------------------------------------------
        # CHECK RANGE
        # --------------------------------------------------

        if not (
            0 <= class_id < len(
                self.label_classes
            )
        ):
            raise ValueError(
                f"Model class {class_id} is outside "
                "LabelEncoder range."
            )

        # --------------------------------------------------
        # LABEL ENCODER
        # --------------------------------------------------

        return str(
            self.label_encoder.inverse_transform(
                [class_id]
            )[0]
        )

    # ======================================================
    # PREDICT
    # ======================================================

    def predict(self, landmarks):

        features = self._prepare_features(
            landmarks
        )

        # ==================================================
        # MODEL INPUT
        # ==================================================

        X = features.reshape(
            1,
            63
        )

        print()
        print("-" * 70)
        print("PREDICTION DEBUG")
        print("-" * 70)

        print(
            "Input shape:",
            X.shape
        )

        print(
            "Min:",
            float(np.min(X))
        )

        print(
            "Max:",
            float(np.max(X))
        )

        print(
            "Mean:",
            float(np.mean(X))
        )

        # ==================================================
        # FEATURE VALIDATION
        # ==================================================

        if self.expected_features is not None:

            if X.shape[1] != self.expected_features:

                raise ValueError(
                    f"Model expects "
                    f"{self.expected_features} features "
                    f"but received {X.shape[1]}."
                )

        # ==================================================
        # RAW PREDICTION
        # ==================================================

        raw_prediction = self.model.predict(
            X
        )[0]

        print(
            "Raw prediction:",
            repr(raw_prediction)
        )

        # ==================================================
        # PROBABILITIES
        # ==================================================

        probabilities = None

        if hasattr(
            self.model,
            "predict_proba"
        ):

            probabilities = (
                self.model
                .predict_proba(X)[0]
            )

        # ==================================================
        # DECODE
        # ==================================================

        prediction = self._decode_class(
            raw_prediction
        )

        # ==================================================
        # CONFIDENCE
        # ==================================================

        confidence = 0.0

        if probabilities is not None:

            confidence = float(
                np.max(probabilities)
            )

        # ==================================================
        # TOP 5
        # ==================================================

        top_predictions = []

        if (
            probabilities is not None
            and
            self.model_classes is not None
        ):

            top_indices = np.argsort(
                probabilities
            )[::-1][:5]

            for index in top_indices:

                index = int(index)

                model_class = (
                    self.model_classes[index]
                )

                decoded_label = (
                    self._decode_class(
                        model_class
                    )
                )

                probability = float(
                    probabilities[index]
                )

                top_predictions.append({

                    "label":
                        decoded_label,

                    "confidence":
                        round(
                            probability * 100,
                            2
                        ),

                    "class":
                        str(model_class)

                })

        # ==================================================
        # RESULT
        # ==================================================

        result = {

            "prediction":
                prediction,

            "confidence":
                round(
                    confidence * 100,
                    2
                ),

            "top_predictions":
                top_predictions

        }

        print(
            "Prediction:",
            result["prediction"]
        )

        print(
            "Confidence:",
            result["confidence"]
        )

        print(
            "Top predictions:",
            result["top_predictions"]
        )

        print("-" * 70)
        print()

        return result