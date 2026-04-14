FROM nvidia/cuda:12.1.1-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV HUNYUAN_REPO_DIR=/app/hunyuan3d
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

RUN pip install fastapi==0.115.5 uvicorn[standard]==0.32.1

RUN git clone --depth 1 https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1.git ${HUNYUAN_REPO_DIR}

WORKDIR ${HUNYUAN_REPO_DIR}

RUN pip install -r requirements.txt && \
    pip install -e . 2>/dev/null || true

RUN cd hy3dpaint/custom_rasterizer && pip install -e . && \
    cd ../DifferentiableRenderer && bash compile_mesh_painter.sh && \
    mkdir -p hy3dpaint/ckpt && \
    wget https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth -P hy3dpaint/ckpt

COPY app.py /app/app.py
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]
