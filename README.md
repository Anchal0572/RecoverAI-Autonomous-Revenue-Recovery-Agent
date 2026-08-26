# RecoverAI — Autonomous Revenue Recovery Agent

> A full-stack fintech application that uses machine learning to recover failed payments autonomously.

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Recharts, TanStack Query |
| Backend | Node.js, Express, TypeScript, MongoDB (Mongoose), JWT |
| ML Engine | Python, FastAPI, Scikit-learn (RandomForest), Pandas |
| Database | MongoDB (with in-memory fallback via mongodb-memory-server) |

## 📦 Project Structure

`
RecoverAI/
├── frontend/          # React + Vite frontend
├── server/            # Node.js + Express + TypeScript backend  
├── ml-service/        # Python FastAPI ML prediction engine
└── backend/           # Legacy Express backend (reference)
`

## ✨ Features

- **Real-time Risk Detection** — Every failed payment is analyzed by the ML engine
- **ML Recovery Probability** — RandomForest classifier predicts recovery likelihood (ROC-AUC: 0.86)
- **Autonomous Agent** — AI selects recovery strategies (retry, email, SMS, payment method change)
- **Dashboard** — Live metrics: revenue at risk, recovery rate, expected recovery
- **Audit Trail** — Immutable log of every autonomous decision with date filters
- **Model Performance** — ROC Curve, Confusion Matrix, Feature Importance charts
- **JWT Auth** — Secure merchant + user authentication

## 🏃 Running Locally

`ash
# 1. Frontend
cd frontend && npm install && npm run dev

# 2. Backend
cd server && npm install && npm run dev

# 3. ML Service
cd ml-service
python -m venv venv
venv/Scripts/activate
pip install -r requirements.txt
python run.py
`

## 👩‍💻 Author

**Anchal Keshri** — Built with ❤️ as a full-stack + ML fintech project
