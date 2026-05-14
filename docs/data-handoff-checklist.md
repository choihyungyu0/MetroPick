# MetroPick AI Data Handoff Checklist

## Purpose

This checklist defines the first clean handoff path for public commercial-store
CSV data. It is intended for the data-analysis teammate who will provide the
downloaded file and for the engineer who will validate that MetroPick AI is
using it correctly.

The current system must keep using sample fixture fallback data until a real
approved CSV is placed in the expected local folder.

## Required public data files

| Dataset | Status | Notes |
| --- | --- | --- |
| `소상공인시장진흥공단_상가(상권)정보` | Required first | Used for station-area store-count and category summaries. |

## Required CSV location

Place the downloaded CSV file under:

```text
data/raw/public_store_data/
```

The committed `example_public_store_template.csv` file is only a schema
template and is ignored by the ingestion script.

## Required columns

The first dataset must include these provider columns:

- `상가업소번호`
- `상호명`
- `상권업종대분류명`
- `상권업종중분류명`
- `상권업종소분류명`
- `상권업종코드`
- `시도명`
- `시군구명`
- `법정동명`
- `지번주소`
- `도로명주소`
- `경도`
- `위도`

## Optional columns

The ingestion path should not fail if additional provider columns are present.
Optional useful columns for future work include:

- `행정동명`
- `표준산업분류코드`
- `표준산업분류명`
- `건물명`
- `층정보`
- `호정보`
- `전화번호`

## Encoding notes

The loader attempts common Korean CSV encodings in this order:

1. `utf-8-sig`
2. `utf-8`
3. `cp949`
4. `euc-kr`

If column names appear garbled, re-export the source file as UTF-8 CSV or keep
the original public-data CSV without editing it in spreadsheet software.

## Validation commands

Run these commands from the repository root in Windows PowerShell:

```powershell
.\.venv\Scripts\python.exe scripts/build_public_store_summary.py
.\.venv\Scripts\python.exe -m pytest
npm.cmd run validate
```

Run the backend for API checks:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

## Success criteria

- `scripts/build_public_store_summary.py` prints `source_mode = public_store_csv`.
- `data/processed/public_store_data/station_area_store_summary.csv` is created.
- `GET /api/commercial-analysis/summary` returns `data_status = public_store_csv`.
- `GET /api/commercial-analysis/store-summary` returns `rows` with station summaries.
- Non-Gwangju rows are filtered out.
- Rows with invalid or missing coordinates are filtered out.
- The frontend still falls back to mock data if the backend is unavailable.

## Common errors and fixes

| Error | Likely cause | Fix |
| --- | --- | --- |
| `source_mode = sample_fixture` | No real CSV found, or only the template CSV exists. | Place the downloaded CSV under `data/raw/public_store_data/` with a different filename. |
| Empty station summaries | Coordinates are missing, invalid, or outside Korea bounds. | Check `경도` and `위도` values before processing. |
| Missing required columns | Provider schema changed or a spreadsheet export removed headers. | Compare the file headers with the required column list above. |
| Garbled Korean column names | CSV encoding mismatch. | Try the original source CSV, UTF-8 with BOM, or CP949 export. |
| Real CSV appears in `git status` | `.gitignore` rule was bypassed or filename is a committed exception. | Do not commit real public-data files unless approved as a small fixture. |

## Contact/check owner fields

- Data owner:
- Engineering owner:
- QA checker:
- Source download date:
- Source URL:
- File name:
- Row count before filtering:
- Row count after Gwangju and coordinate filtering:
- Notes:
