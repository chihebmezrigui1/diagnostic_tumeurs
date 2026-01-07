# Remplace ce stub par ton vrai code (Torch/TF/Sklearn…)
from dataclasses import dataclass
from typing import Tuple

MODEL_VERSION = "brainnet-v1.0"  # change selon ton modèle

# Ex. mapping si tu veux
LABELS = ("glioma","meningioma","pituitary","no_tumor")

@dataclass
class Prediction:
    tumor_type: str      # "glioma" | "meningioma" | "pituitary" | "no_tumor"
    confidence: float    # 0..1
    severity: str | None # "low" | "moderate" | "high" | None

def _heuristic_severity(tumor_type: str, conf: float) -> str | None:
    if tumor_type == "no_tumor":
        return None
    if conf >= 0.85: return "high"
    if conf >= 0.6:  return "moderate"
    return "low"

def predict(image_path: str) -> Prediction:
    """
    TODO: charge ton modèle au module-level, préprocess `image_path`,
    fais l’inférence et renvoie (tumor_type, confidence[, severity]).
    Ici on renvoie un fake pour illustrer.
    """
    # --- replace by real inference ---
    fake_tumor = "no_tumor"
    fake_conf  = 0.05
    # ---------------------------------
    return Prediction(
        tumor_type=fake_tumor,
        confidence=float(fake_conf),
        severity=_heuristic_severity(fake_tumor, float(fake_conf)),
    )
