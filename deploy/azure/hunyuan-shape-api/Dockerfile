FROM nvidia/cuda:12.4.1-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV HUNYUAN_REPO_DIR=/app/hunyuan3d
ENV MODEL_PATH=tencent/Hunyuan3D-2.1
ENV PORT=8080
ENV PYOPENGL_PLATFORM=egl
ENV CUDA_HOME=/usr/local/cuda
ENV PATH=${CUDA_HOME}/bin:${PATH}
ENV LD_LIBRARY_PATH=${CUDA_HOME}/lib64:${LD_LIBRARY_PATH}

RUN set -eux; \
    for attempt in 1 2 3 4 5; do \
      apt-get update && apt-get install -y --no-install-recommends \
        python3.10 python3-pip python3-dev \
        python3-setuptools git git-lfs wget curl build-essential cmake \
        pkg-config libglvnd0 libgl1 libglx0 libegl1 libgles2 \
        libglvnd-dev libgl1-mesa-dev libegl1-mesa-dev libgles2-mesa-dev \
        libglib2.0-0 libxrender1 libxext6 libsm6 \
        libxi6 libxkbcommon-x11-0 libxrender-dev libeigen3-dev libcgal-dev && \
      rm -rf /var/lib/apt/lists/* && break; \
      rm -rf /var/lib/apt/lists/*; \
      if [ "$attempt" -eq 5 ]; then exit 1; fi; \
      sleep 15; \
    done

RUN ln -sf /usr/bin/python3.10 /usr/bin/python && \
    ln -sf /usr/bin/python3.10 /usr/bin/python3

RUN pip install --upgrade pip setuptools wheel

RUN pip install \
    torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1 \
    --index-url https://download.pytorch.org/whl/cu124

RUN pip install fastapi==0.115.5 uvicorn[standard]==0.32.1 httpx==0.28.1

RUN git clone --depth 1 https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1.git ${HUNYUAN_REPO_DIR}

WORKDIR ${HUNYUAN_REPO_DIR}

RUN pip install -r hy3dshape/requirements.txt

COPY deploy/azure/hunyuan-shape-api/app.py /app/app.py
COPY deploy/azure/hunyuan-shape-api/start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]
