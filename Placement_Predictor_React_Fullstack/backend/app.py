from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "placement_predictor.joblib"

FEATURE_COLUMNS = [
    "CGPA", "Internships", "Projects", "Workshops/Certifications",
    "AptitudeTestScore", "SoftSkillsRating",
    "ExtracurricularActivities", "PlacementTraining",
    "SSC_Marks", "HSC_Marks",
]

app = FastAPI(title="Placement Intelligence API", version="1.0.0")
origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in origins if x.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

class StudentInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    cgpa: float = Field(ge=0, le=10)
    internships: int = Field(ge=0, le=30)
    projects: int = Field(ge=0, le=100)
    certifications: int = Field(ge=0, le=100)
    aptitude: float = Field(ge=0, le=100)
    soft_skills: float = Field(ge=0, le=5)
    extracurricular: Literal["Yes", "No"]
    placement_training: Literal["Yes", "No"]
    ssc_marks: float = Field(ge=0, le=100)
    hsc_marks: float = Field(ge=0, le=100)

def load_artifact():
    # joblib uses pickle internally. Only load model files from a trusted source.
    try:
        artifact = joblib.load(MODEL_PATH)
    except Exception as exc:
        raise RuntimeError(
            "Unable to load the saved model. The Colab and backend scikit-learn "
            "versions may differ. Check backend/README.md for version guidance."
        ) from exc
    if not isinstance(artifact, dict) or not {"model", "label_encoder"}.issubset(artifact):
        raise RuntimeError("Unexpected model artifact format.")
    return artifact

artifact = None
model_error = None

@app.on_event("startup")
def startup():
    global artifact, model_error
    try:
        artifact = load_artifact()
        model_error = None
    except Exception as exc:
        artifact = None
        model_error = str(exc)

@app.get("/api/health")
def health():
    return {
        "status": "ready" if artifact is not None else "model_unavailable",
        "model_loaded": artifact is not None,
        "model_name": artifact.get("selected_model_name", "Saved classifier") if artifact else None,
        "error": model_error,
    }

@app.get("/api/model-info")
def model_info():
    if artifact is None:
        raise HTTPException(status_code=503, detail=model_error or "Model unavailable")
    return {
        "name": artifact.get("selected_model_name", "Saved classifier"),
        "features": artifact.get("feature_columns", FEATURE_COLUMNS),
        "validation_metrics": artifact.get("validation_metrics", []),
        "classes": [str(x) for x in artifact["label_encoder"].classes_],
    }

@app.post("/api/predict")
def predict(student: StudentInput):
    if artifact is None:
        raise HTTPException(status_code=503, detail=model_error or "Model unavailable")

    row = {
        "CGPA": student.cgpa,
        "Internships": student.internships,
        "Projects": student.projects,
        "Workshops/Certifications": student.certifications,
        "AptitudeTestScore": student.aptitude,
        "SoftSkillsRating": student.soft_skills,
        "ExtracurricularActivities": student.extracurricular,
        "PlacementTraining": student.placement_training,
        "SSC_Marks": student.ssc_marks,
        "HSC_Marks": student.hsc_marks,
    }
    expected = artifact.get("feature_columns", FEATURE_COLUMNS)
    missing = set(expected) - set(row)
    if missing:
        raise HTTPException(status_code=500, detail=f"Unknown model feature columns: {sorted(missing)}")

    frame = pd.DataFrame([row], columns=expected)
    try:
        model = artifact["model"]
        encoded_prediction = model.predict(frame)
        prediction = str(artifact["label_encoder"].inverse_transform(encoded_prediction)[0])
        probabilities = {}
        if hasattr(model, "predict_proba"):
            scores = model.predict_proba(frame)[0]
            classifier_classes = model.classes_
            labels = artifact["label_encoder"].inverse_transform(classifier_classes)
            probabilities = {str(label): round(float(score), 6) for label, score in zip(labels, scores)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    return {
        "prediction": prediction,
        "probability_placed": probabilities.get("Placed"),
        "probabilities": probabilities,
        "model_name": artifact.get("selected_model_name", "Saved classifier"),
        "disclaimer": "An estimated classification from a historical dataset, not a placement guarantee.",
    }
