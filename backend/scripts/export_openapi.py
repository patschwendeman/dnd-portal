"""Write the OpenAPI schema of the app to backend/openapi.json (deterministic: sorted keys, 2-space indent).

Usage (in backend/): uv run python scripts/export_openapi.py
Importing app.main connects to no database, but `Settings` needs the DB_*/POSTGRES_* values (backend/.env or
environment). The frontend generates its API types from this file (npm run generate:api).
"""

import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PATH = BACKEND_DIR / "openapi.json"


def main() -> None:
    # Running a script puts scripts/ on sys.path, not backend/; the package `app` lives in backend/.
    sys.path.insert(0, str(BACKEND_DIR))
    from app.main import app

    OUTPUT_PATH.write_text(json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
