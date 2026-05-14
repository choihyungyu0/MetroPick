# Public Store Data Drop Folder

Put real downloaded public commercial-store CSV files in this folder.

Large CSV and XLSX files are gitignored. Do not commit real public data files
unless they are small approved fixtures.

After placing a real CSV, run:

```powershell
.\.venv\Scripts\python.exe scripts/build_public_store_summary.py
```

The committed `example_public_store_template.csv` file is only a tiny schema
template. It is not real public data and is ignored by the ingestion script.
