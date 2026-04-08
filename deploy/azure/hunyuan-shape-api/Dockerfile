FROM nvidia/cuda:12.1.1-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV HUNYUAN_REPO_DIR=/app/hunyuan3d
ENV MODEL_PATH=tencent/Hunyuan3D-2.1
ENV MODEL_SUBFOLDER=hunyuan3d-dit-v2-1
ENV PORT=8080

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 python3-pip python3-dev \
    git wget curl build-essential \
    libgl1-mesa-glx libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN ln -sf /usr/bin/python3.10 /usr/bin/python && \
    ln -sf /usr/bin/python3.10 /usr/bin/python3

RUN pip install \
    torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1 \
    --index-url https://download.pytorch.org/whl/cu124

RUN git clone --depth 1 https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1.git ${HUNYUAN_REPO_DIR}

WORKDIR ${HUNYUAN_REPO_DIR}

RUN pip install -r requirements.txt && \
    pip install -e . 2>/dev/null || true

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]
