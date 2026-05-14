# MetroPick AI Local Validation Commands

Run commands from the repository root in Windows PowerShell.

## Frontend

```powershell
npm.cmd run validate
npm.cmd run dev
```

## Python

```powershell
.\.venv\Scripts\python.exe scripts/build_public_store_summary.py
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ml.train_startup_suitability
```

## Backend

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

## API checks

Open these URLs while the backend is running:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/api/commercial-analysis/summary`
- `http://127.0.0.1:8000/api/commercial-analysis/store-summary`
