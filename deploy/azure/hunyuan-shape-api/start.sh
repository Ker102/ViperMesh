#!/usr/bin/env bash
set -euo pipefail

cd "${HUNYUAN_REPO_DIR:-/app/hunyuan3d}"

LOW_VRAM_FLAG=""
if [ "${LOW_VRAM_MODE:-1}" = "1" ]; then
  LOW_VRAM_FLAG="--low_vram_mode"
fi

FLASH_VDM_FLAG=""
if [ "${ENABLE_FLASHVDM:-0}" = "1" ]; then
  FLASH_VDM_FLAG="--enable_flashvdm"
fi

COMPILE_FLAG=""
if [ "${ENABLE_COMPILE:-0}" = "1" ]; then
  COMPILE_FLAG="--compile"
fi

exec python -u api_server.py \
  --host 0.0.0.0 \
  --port "${PORT:-8080}" \
  --model_path "${MODEL_PATH:-tencent/Hunyuan3D-2.1}" \
  --subfolder "${MODEL_SUBFOLDER:-hunyuan3d-dit-v2-1}" \
  ${LOW_VRAM_FLAG} \
  ${FLASH_VDM_FLAG} \
  ${COMPILE_FLAG}
