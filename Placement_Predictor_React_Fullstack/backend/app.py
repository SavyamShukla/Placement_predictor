from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
import shap
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
shap_explainer = None
model_error = None

FEATURE_METADATA = {
    "CGPA": {
        "name": "CGPA",
        "description": "Academic grade point average",
        "format": lambda v: f"{float(v):.1f} / 10",
        "pos": lambda v: f"Higher CGPA ({float(v):.1f}/10) positively influenced this prediction.",
        "neg": lambda v: f"Lower CGPA ({float(v):.1f}/10) negatively influenced this prediction.",
    },
    "Internships": {
        "name": "Internships",
        "description": "Internships completed",
        "format": lambda v: f"{int(v)} completed",
        "pos": lambda v: f"Completed internships ({int(v)}) positively influenced this prediction.",
        "neg": lambda v: "Lack of internships negatively influenced this prediction." if int(v) == 0 else f"Fewer internships ({int(v)}) negatively influenced this prediction.",
    },
    "Projects": {
        "name": "Projects",
        "description": "Technical projects completed",
        "format": lambda v: f"{int(v)} completed",
        "pos": lambda v: f"Strong project portfolio ({int(v)} projects) positively influenced this prediction.",
        "neg": lambda v: "Limited project portfolio negatively influenced this prediction." if int(v) <= 1 else f"Fewer completed projects ({int(v)}) negatively influenced this prediction.",
    },
    "Workshops/Certifications": {
        "name": "Workshops & Certifications",
        "description": "Professional certifications and workshops",
        "format": lambda v: f"{int(v)} completed",
        "pos": lambda v: f"Active workshop & certification background ({int(v)}) positively influenced this prediction.",
        "neg": lambda v: "Lack of certifications or workshops negatively influenced this prediction." if int(v) == 0 else f"Fewer workshops/certifications ({int(v)}) negatively influenced this prediction.",
    },
    "AptitudeTestScore": {
        "name": "Aptitude Test Score",
        "description": "Cognitive and reasoning assessment",
        "format": lambda v: f"{float(v):.0f} / 100",
        "pos": lambda v: f"Strong aptitude score ({float(v):.0f}/100) positively influenced this prediction.",
        "neg": lambda v: f"Lower aptitude score ({float(v):.0f}/100) negatively influenced this prediction.",
    },
    "SoftSkillsRating": {
        "name": "Soft Skills Rating",
        "description": "Communication and interpersonal assessment",
        "format": lambda v: f"{float(v):.1f} / 5",
        "pos": lambda v: f"High soft skills rating ({float(v):.1f}/5) positively influenced this prediction.",
        "neg": lambda v: f"Lower soft skills rating ({float(v):.1f}/5) negatively influenced this prediction.",
    },
    "ExtracurricularActivities": {
        "name": "Extracurricular Activities",
        "description": "Campus leadership & activities",
        "format": lambda v: str(v),
        "pos": lambda v: "Participation in extracurricular activities positively influenced this prediction.",
        "neg": lambda v: "Lack of extracurricular activity participation negatively influenced this prediction.",
    },
    "PlacementTraining": {
        "name": "Placement Training",
        "description": "Campus placement readiness program",
        "format": lambda v: str(v),
        "pos": lambda v: "Completion of placement training positively influenced this prediction.",
        "neg": lambda v: "Lack of placement training negatively influenced this prediction.",
    },
    "SSC_Marks": {
        "name": "Class 10 (SSC) Marks",
        "description": "Secondary school percentage",
        "format": lambda v: f"{float(v):.0f}%",
        "pos": lambda v: f"Strong Class 10 academic performance ({float(v):.0f}%) positively influenced this prediction.",
        "neg": lambda v: f"Lower Class 10 marks ({float(v):.0f}%) negatively influenced this prediction.",
    },
    "HSC_Marks": {
        "name": "Class 12 (HSC) Marks",
        "description": "Higher secondary percentage",
        "format": lambda v: f"{float(v):.0f}%",
        "pos": lambda v: f"Strong Class 12 academic performance ({float(v):.0f}%) positively influenced this prediction.",
        "neg": lambda v: f"Lower Class 12 marks ({float(v):.0f}%) negatively influenced this prediction.",
    },
}

def init_shap_explainer(pipeline):
    try:
        preprocessor = pipeline.named_steps["preprocessor"]
        classifier = pipeline.named_steps["classifier"]
        bg_rows = []
        for extra in ["No", "Yes"]:
            for train in ["No", "Yes"]:
                bg_rows.append({
                    "CGPA": 7.70,
                    "Internships": 1.05,
                    "Projects": 2.03,
                    "Workshops/Certifications": 1.02,
                    "AptitudeTestScore": 79.47,
                    "SoftSkillsRating": 4.33,
                    "ExtracurricularActivities": extra,
                    "PlacementTraining": train,
                    "SSC_Marks": 69.19,
                    "HSC_Marks": 74.46,
                })
        bg_df = pd.DataFrame(bg_rows)
        X_bg = preprocessor.transform(bg_df)
        explainer = shap.LinearExplainer(classifier, X_bg)
        return explainer
    except Exception as exc:
        print(f"Failed to initialize SHAP explainer: {exc}")
        return None

def generate_shap_explanation(pipeline, explainer, row_dict):
    if explainer is None:
        return None
    try:
        frame = pd.DataFrame([row_dict], columns=FEATURE_COLUMNS)
        preprocessor = pipeline.named_steps["preprocessor"]
        X_trans = preprocessor.transform(frame)
        shap_vals = explainer(X_trans).values[0]

        numeric_keys = [
            "CGPA", "Internships", "Projects", "Workshops/Certifications",
            "AptitudeTestScore", "SoftSkillsRating", "SSC_Marks", "HSC_Marks"
        ]
        raw_contribs = {}
        for idx, key in enumerate(numeric_keys):
            raw_contribs[key] = float(shap_vals[idx])

        # Categorical features sum one-hot dummy indices
        raw_contribs["ExtracurricularActivities"] = float(shap_vals[8] + shap_vals[9])
        raw_contribs["PlacementTraining"] = float(shap_vals[10] + shap_vals[11])

        all_features = []
        for feat_key, contrib in raw_contribs.items():
            meta = FEATURE_METADATA.get(feat_key, {})
            val = row_dict[feat_key]
            is_pos = contrib >= 0
            explanation_text = meta["pos"](val) if is_pos else meta["neg"](val)
            formatted_val = meta["format"](val) if "format" in meta else str(val)

            all_features.append({
                "feature": feat_key,
                "display_name": meta.get("name", feat_key),
                "description": meta.get("description", ""),
                "value": val,
                "formatted_value": formatted_val,
                "contribution": round(contrib, 4),
                "direction": "positive" if is_pos else "negative",
                "explanation": explanation_text,
            })

        all_sorted = sorted(all_features, key=lambda x: abs(x["contribution"]), reverse=True)
        top_positive = [f for f in all_sorted if f["direction"] == "positive"]
        top_negative = [f for f in all_sorted if f["direction"] == "negative"]

        return {
            "top_positive": top_positive,
            "top_negative": top_negative,
            "all_features": all_sorted,
            "causation_notice": "These explanations describe how the trained machine learning model arrived at its prediction based on patterns in historical training data. SHAP feature attributions reflect statistical model behavior and do not establish real-world causation.",
        }
    except Exception as exc:
        print(f"SHAP explanation generation error: {exc}")
        return None

@app.on_event("startup")
def startup():
    global artifact, shap_explainer, model_error
    try:
        artifact = load_artifact()
        shap_explainer = init_shap_explainer(artifact["model"])
        model_error = None
    except Exception as exc:
        artifact = None
        shap_explainer = None
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
        raw_prediction = str(artifact["label_encoder"].inverse_transform(encoded_prediction)[0])
        probabilities = {}
        if hasattr(model, "predict_proba"):
            scores = model.predict_proba(frame)[0]
            classifier_classes = model.classes_
            labels = artifact["label_encoder"].inverse_transform(classifier_classes)
            probabilities = {str(label): round(float(score), 6) for label, score in zip(labels, scores)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    # Standardize placement status to "Placed" or "Not Placed"
    if raw_prediction in ("Placed", "1", 1):
        status = "Placed"
    else:
        status = "Not Placed"

    # Compute explicit placed and non-placement probabilities
    prob_placed = probabilities.get("Placed")
    prob_not_placed = probabilities.get("NotPlaced")

    if prob_placed is None and prob_not_placed is not None:
        prob_placed = round(1.0 - prob_not_placed, 6)
    elif prob_not_placed is None and prob_placed is not None:
        prob_not_placed = round(1.0 - prob_placed, 6)
    elif prob_placed is None and prob_not_placed is None:
        prob_placed = 1.0 if status == "Placed" else 0.0
        prob_not_placed = 0.0 if status == "Placed" else 1.0

    # Categorize into clearly defined probability ranges:
    # High: >= 70%
    # Moderate: 40% to 69.999%
    # Low: < 40%
    if prob_placed >= 0.70:
        result_summary = "High predicted placement probability"
        summary_tier = "high"
    elif prob_placed >= 0.40:
        result_summary = "Moderate predicted placement probability"
        summary_tier = "moderate"
    else:
        result_summary = "Low predicted placement probability"
        summary_tier = "low"

    # Generate SHAP explanation
    global shap_explainer
    if shap_explainer is None and artifact is not None:
        shap_explainer = init_shap_explainer(artifact["model"])
    explanation = generate_shap_explanation(artifact["model"], shap_explainer, row)

    return {
        "prediction": status,
        "placement_status": status,
        "raw_prediction": raw_prediction,
        "probability_placed": prob_placed,
        "probability_not_placed": prob_not_placed,
        "result_summary": result_summary,
        "summary_tier": summary_tier,
        "probability_ranges": {
            "high": ">= 70%",
            "moderate": "40% - 69.9%",
            "low": "< 40%",
        },
        "probabilities": probabilities,
        "explanation": explanation,
        "model_name": artifact.get("selected_model_name", "Saved classifier"),
        "disclaimer": "An estimated classification from a historical dataset. Probability categories reflect statistical likelihood and do not guarantee or imply a placement outcome.",
    }

@app.post("/api/explain")
def explain(student: StudentInput):
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
    global shap_explainer
    if shap_explainer is None:
        shap_explainer = init_shap_explainer(artifact["model"])
    explanation = generate_shap_explanation(artifact["model"], shap_explainer, row)
    return {"explanation": explanation}

class SimulationRequest(BaseModel):
    original: StudentInput
    modified: StudentInput

@app.post("/api/simulate")
def simulate(request: SimulationRequest):
    if artifact is None:
        raise HTTPException(status_code=503, detail=model_error or "Model unavailable")

    orig_res = predict(request.original)
    mod_res = predict(request.modified)

    orig_p = orig_res["probability_placed"]
    mod_p = mod_res["probability_placed"]
    diff_pp = round((mod_p - orig_p) * 100, 2)

    orig_np = orig_res["probability_not_placed"]
    mod_np = mod_res["probability_not_placed"]
    diff_np_pp = round((mod_np - orig_np) * 100, 2)

    field_labels = {
        "cgpa": ("CGPA", "/ 10"),
        "aptitude": ("Aptitude Test Score", "/ 100"),
        "soft_skills": ("Soft Skills Rating", "/ 5"),
        "ssc_marks": ("Class 10 Marks", "%"),
        "hsc_marks": ("Class 12 Marks", "%"),
        "internships": ("Internships Completed", "completed"),
        "projects": ("Projects Completed", "completed"),
        "certifications": ("Workshops / Certifications", "completed"),
        "extracurricular": ("Extracurricular Activities", ""),
        "placement_training": ("Placement Training", ""),
    }

    orig_dict = request.original.model_dump()
    mod_dict = request.modified.model_dump()
    changed_inputs = []

    for key, (label, unit) in field_labels.items():
        v_orig = orig_dict[key]
        v_mod = mod_dict[key]
        if v_orig != v_mod:
            delta = None
            if isinstance(v_orig, (int, float)) and isinstance(v_mod, (int, float)):
                delta = round(v_mod - v_orig, 2)
            changed_inputs.append({
                "field": key,
                "label": label,
                "unit": unit,
                "original_value": v_orig,
                "modified_value": v_mod,
                "delta": delta,
            })

    return {
        "original": {
            "prediction": orig_res["prediction"],
            "placement_status": orig_res["placement_status"],
            "probability_placed": orig_p,
            "probability_not_placed": orig_np,
            "result_summary": orig_res["result_summary"],
            "summary_tier": orig_res["summary_tier"],
        },
        "modified": {
            "prediction": mod_res["prediction"],
            "placement_status": mod_res["placement_status"],
            "probability_placed": mod_p,
            "probability_not_placed": mod_np,
            "result_summary": mod_res["result_summary"],
            "summary_tier": mod_res["summary_tier"],
        },
        "probability_difference_pp": diff_pp,
        "non_placement_difference_pp": diff_np_pp,
        "status_changed": orig_res["placement_status"] != mod_res["placement_status"],
        "changed_inputs": changed_inputs,
    }
