# Placement Predictor

An end-to-end Machine Learning and Full-Stack web application designed to predict campus placement likelihood and provide actionable insights for students based on academic credentials, internships, projects, and skills.

---

## 📁 Repository Structure

```
├── Placement_Predictor_Preprocessing_EDA.ipynb   # Exploratory Data Analysis & Feature Engineering
├── Placement_Predictor_Training.ipynb            # Model Training, Evaluation & Joblib Export
├── Placement_Predictor_React_Fullstack/          # Full-Stack Application
│   ├── backend/                                  # FastAPI inference server
│   │   ├── app.py
│   │   ├── requirements.txt
│   │   └── models/
│   │       └── placement_predictor.joblib        # Trained scikit-learn pipeline artifact
│   ├── frontend/                                 # React + Vite web dashboard
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.js
│   └── README.md                                 # Full-stack setup & API guide
└── README.md
```

---

## 🚀 Getting Started

### 1. Machine Learning Notebooks
- **`Placement_Predictor_Preprocessing_EDA.ipynb`**: Data cleaning, distribution analysis, correlation analysis, and feature selection.
- **`Placement_Predictor_Training.ipynb`**: Model comparison, hyperparameter tuning, evaluation metrics, and model serialization into `placement_predictor.joblib`.

### 2. Full-Stack Web Application

Refer to the [Placement_Predictor_React_Fullstack README](./Placement_Predictor_React_Fullstack/README.md) for detailed instructions.

#### Backend (FastAPI)
```powershell
cd Placement_Predictor_React_Fullstack/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

#### Frontend (React + Vite)
```powershell
cd Placement_Predictor_React_Fullstack/frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
