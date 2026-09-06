# Credit Risk Scoring Engine

A loan default prediction system with three connected parts: a machine learning model, a REST API, and a live underwriting dashboard.

Built on the Home Credit Default Risk dataset (Kaggle). The model predicts whether a loan applicant is likely to default, explains why using SHAP, and presents the result in a dashboard a loan officer could actually use.

## How it works

1. Fill in an applicant's details in the dashboard
2. The dashboard calls the API with those details
3. The API runs the trained XGBoost model
4. Returns a default probability, a decision (Approve / Reject), and the top 3 reasons behind it
5. Dashboard displays everything in real time

## Project layout

```
Home-Credit/
├── model/              # ML pipeline (data cleaning, training, SHAP)
│   └── notebooks/      # modelling.ipynb — run this first
├── api/                # FastAPI server
│   ├── main.py
│   └── test_main.py    # automated test suite
└── dashboard/          # Next.js frontend
    └── app/
        ├── page.tsx
        └── lib.ts
```

## Model results

The dataset has an 8% default rate — accuracy is meaningless here. These are the honest metrics:

| Model | AUC |
|---|---|
| Logistic Regression (baseline) | 0.7482 |
| XGBoost — application data only | 0.7596 |
| XGBoost — all 6 tables, feature engineered | **0.7765** |

## Running locally

You need Python 3.9+ and Node.js 18+. Three separate processes, each in its own terminal.

### Get the data

Download [Home Credit Default Risk](https://www.kaggle.com/c/home-credit-default-risk) from Kaggle and put the CSVs in `model/data/`.

### Terminal 1 — train the model (one time only)

```bash
cd model
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
jupyter lab
```

Open `notebooks/modelling.ipynb` and run all cells. This saves the trained model to `model/saved_models/`.

Then copy the saved model files to the API:

```bash
cp model/saved_models/*.pkl api/saved_models/
```

### Terminal 2 — start the API

```bash
cd api
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn scikit-learn xgboost shap joblib pandas numpy pydantic
uvicorn main:app --reload
```

API runs at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### Terminal 3 — start the dashboard

```bash
cd dashboard
npm install
npm run dev
```

Dashboard runs at `http://localhost:3000`

Both Terminal 2 and Terminal 3 need to stay running while you use the app.

## Tests

```bash
cd api
source venv/bin/activate
pytest test_main.py -v
```

18 tests across 6 categories — unit, integration, boundary value analysis, equivalence partitioning, negative/error handling, and acceptance. All passing.

## Stack

- Model — scikit-learn, XGBoost, SHAP, pandas
- API — FastAPI, pydantic, uvicorn
- Dashboard — Next.js, TypeScript, Tailwind CSS
- Tests — pytest

## Dataset

Home Credit Default Risk — [kaggle.com/c/home-credit-default-risk](https://www.kaggle.com/c/home-credit-default-risk)

Raw CSVs are not committed to this repo (too large). Download from Kaggle and place in `model/data/`.