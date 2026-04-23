FROM nvidia/cuda:12.4.1-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV HUNYUAN_REPO_DIR=/app/hunyuan3d
ENV PORT=8080
ENV PYOPENGL_PLATFORM=egl
ENV CUDA_HOME=/usr/local/cuda
ENV PATH=${CUDA_HOME}/bin:${PATH}
ENV LD_LIBRARY_PATH=${CUDA_HOME}/lib64:${LD_LIBRARY_PATH}
ENV TORCH_CUDA_ARCH_LIST="6.0;6.1;7.0;7.5;8.0;8.6;8.9;9.0"

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

RUN pip install fastapi==0.115.5 uvicorn[standard]==0.32.1

RUN git clone --depth 1 https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1.git ${HUNYUAN_REPO_DIR}

WORKDIR ${HUNYUAN_REPO_DIR}

RUN python -c "from pathlib import Path; requirements = Path('requirements.txt').read_text().splitlines(); filtered = [line for line in requirements if line.strip() != 'bpy==4.0']; Path('/tmp/hunyuan-paint-requirements.txt').write_text('\\n'.join(filtered) + '\\n')"

RUN pip install -r /tmp/hunyuan-paint-requirements.txt

RUN python -c "from pathlib import Path; path = Path('hy3dpaint/DifferentiableRenderer/mesh_utils.py'); text = path.read_text(); text = text.replace('import bpy\\n', 'try:\\n    import bpy\\nexcept ImportError:\\n    bpy = None\\n\\n'); text = text.replace('def convert_obj_to_glb(\\n', 'def convert_obj_to_glb(\\n'); text = text.replace('    \"\"\"Convert OBJ file to GLB format using Blender.\"\"\"\\n    try:\\n', '    \"\"\"Convert OBJ file to GLB format using Blender.\"\"\"\\n    if bpy is None:\\n        return False\\n    try:\\n'); path.write_text(text)"

RUN cd hy3dpaint/custom_rasterizer && pip install --no-build-isolation -e . && \
    cd ../DifferentiableRenderer && bash compile_mesh_painter.sh

RUN mkdir -p ${HUNYUAN_REPO_DIR}/hy3dpaint/ckpt && \
    wget https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth -P ${HUNYUAN_REPO_DIR}/hy3dpaint/ckpt

COPY deploy/azure/hunyuan-paint-api/app.py /app/app.py
COPY deploy/azure/hunyuan-paint-api/start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]
