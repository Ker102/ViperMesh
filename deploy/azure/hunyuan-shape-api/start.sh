#!/usr/bin/env bash
set -euo pipefail

python -m uvicorn app:app \
  --app-dir /app \
  --host 0.0.0.0 \
  --port "${PORT:-8080}"
