from dataclasses import dataclass
from pathlib import Path
from typing import Optional
import numpy as np
import cv2
import tensorflow as tf

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "EfficientNetB0_Model.keras"
IMAGE_SIZE = 224
TRAIN_LABELS = ["glioma", "notumor", "meningioma", "pituitary"]
FRONTEND_LABELS = {"glioma":"glioma","meningioma":"meningioma","pituitary":"pituitary","notumor":"no_tumor"}
MODEL_VERSION = "efficientnetb0-v1"

@dataclass
class Prediction:
    tumor_type: str
    confidence: float
    severity: Optional[str]

_model: tf.keras.Model | None = None

def _load_model() -> tf.keras.Model:
    global _model
    if _model is None:
        _model = tf.keras.models.load_model(str(MODEL_PATH))
    return _model

def _preprocess(image_path: str) -> np.ndarray:
    img = cv2.imread(image_path)  # BGR comme dans ton Colab
    if img is None:
        raise ValueError("Impossible de lire l'image")
    img = cv2.resize(img, (IMAGE_SIZE, IMAGE_SIZE))
    x = np.expand_dims(img.astype(np.float32), axis=0)  # (1,224,224,3)
    return x

def _severity(label: str, conf: float) -> Optional[str]:
    if label == "no_tumor": return None
    if conf >= 0.85: return "high"
    if conf >= 0.60: return "moderate"
    return "low"

def predict(image_path: str) -> Prediction:
    model = _load_model()
    x = _preprocess(image_path)
    probs = model.predict(x, verbose=0)[0]  # softmax (4,)
    idx = int(np.argmax(probs))
    train_label = TRAIN_LABELS[idx]
    label = FRONTEND_LABELS[train_label]
    conf = float(probs[idx])
    return Prediction(tumor_type=label, confidence=conf, severity=_severity(label, conf))
