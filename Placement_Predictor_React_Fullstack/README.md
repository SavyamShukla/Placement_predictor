# Placement Intelligence — React + FastAPI

A polished full-stack interface for the **actual trained model** saved from `Placement_Predictor_StarterNew.ipynb`.

## What is included

- `frontend/`: responsive React + Vite application with student profile form, loading states, model status, probability gauge, and result panel.
- `backend/`: FastAPI inference server with input validation.
- `backend/models/placement_predictor.joblib`: your uploaded trained artifact, copied without modification.

The backend loads the notebook's saved dictionary (`model`, `label_encoder`, `feature_columns`, `selected_model_name`, `validation_metrics`). The saved `model` is already a scikit-learn **Pipeline**, so the backend sends the **original 10 features** and does **not** encode or scale them again.

## Run locally (Windows PowerShell)

### 1. Start the Python backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

If PowerShell blocks activation, use `\.venv\Scripts\python.exe -m pip install -r requirements.txt` and `\.venv\Scripts\python.exe -m uvicorn app:app --reload --port 8000`.

### 2. Start the React frontend (second terminal)

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

## API

- `GET /api/health` — confirms whether the model loaded
- `GET /api/model-info` — returns selected model and metadata
- `POST /api/predict` — validates 10 student fields and predicts placement

Example payload:

```json
{
  "cgpa": 7.7,
  "internships": 1,
  "projects": 2,
  "certifications": 1,
  "aptitude": 80,
  "soft_skills": 4.4,
  "extracurricular": "Yes",
  "placement_training": "Yes",
  "ssc_marks": 70,
  "hsc_marks": 74
}
```

## If the saved joblib file does not load

Scikit-learn pickle/joblib artifacts are **not guaranteed compatible across library versions**. The app will show `Model unavailable` if the file cannot load.

1. In the **same Colab runtime that successfully trained/saved the model**, run:

   ```python
   import sklearn, pandas, numpy, joblib
   print("scikit-learn", sklearn.__version__)
   print("pandas", pandas.__version__)
   print("numpy", numpy.__version__)
   print("joblib", joblib.__version__)
   ```

2. Install the same compatible versions locally, ideally in a fresh virtual environment.
3. Restart the backend.

**Security:** joblib relies on pickle. Only load model files from sources you trust. Do not expose a public model-upload endpoint.

## Notes

- Inputs reflect the real dataset column names, including `Workshops/Certifications`.
- Values are constrained to sensible bounds, but some are broader than the training distribution; out-of-distribution predictions may be unreliable.
- This is a demonstration/learning tool. Predictions are estimates, not placement guarantees.
- This project does not retrain the model. It uses the model file you supplied.
