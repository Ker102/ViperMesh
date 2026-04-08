# ─────────────────────────────────────────────────────────────────
#  Hunyuan3D Part — RunPod Serverless Worker
#
#  GPU: A4000 (16GB) or A5000 (24GB) — lighter than Paint
#  VRAM: ~10GB during inference
#  Cold start: ~20s with FlashBoot + pre-cached weights
# ─────────────────────────────────────────────────────────────────

FROM nvidia/cuda:12.1.1-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV MODEL_DIR=/models/hunyuan3d-part

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 python3-pip python3-dev \
    git wget curl \
    libgl1-mesa-glx libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN ln -sf /usr/bin/python3.10 /usr/bin/python && \
    ln -sf /usr/bin/python3.10 /usr/bin/python3

# PyTorch / core libs aligned to Tencent's tested Hunyuan3D 2.1 stack.
RUN pip install --no-cache-dir \
    torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1 \
    --index-url https://download.pytorch.org/whl/cu124

# RunPod SDK
RUN pip install --no-cache-dir runpod==1.7.0

# Hunyuan3D dependencies
# Keep these pinned so serverless workers don't drift into incompatible
# dependency combinations at build time.
RUN pip install --no-cache-dir \
    transformers==4.46.0 \
    diffusers==0.30.0 \
    accelerate==1.1.1 \
    huggingface-hub==0.30.2 \
    safetensors==0.4.4 \
    trimesh \
    pillow \
    numpy==1.24.4 \
    requests \
    pygltflib==1.16.3 \
    gradio_client

# Clone and install Hunyuan3D-2
RUN git clone --depth 1 https://github.com/Tencent/Hunyuan3D-2.git /app/hunyuan3d && \
    cd /app/hunyuan3d && \
    pip install --no-cache-dir -e . 2>/dev/null || true

# Download model weights (cached in Docker layer)
RUN mkdir -p ${MODEL_DIR} && \
    python -c " \
    from huggingface_hub import snapshot_download; \
    snapshot_download( \
    'tencent/Hunyuan3D-2', \
    local_dir='${MODEL_DIR}', \
    allow_patterns=['*part*', 'config*', '*.json', '*.safetensors'], \
    ignore_patterns=['*shape*', '*paint*', '*.bin', '*.ckpt'], \
    )" || echo "Model download deferred to runtime"

WORKDIR /app

# Copy handler (relative to build context: deploy/runpod/hunyuan-part/)
COPY handler.py /app/handler.py

EXPOSE 8080

CMD ["python", "-u", "/app/handler.py"]
