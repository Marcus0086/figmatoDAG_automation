# Use the official Python 3.12-slim image as the base
FROM python:3.12-slim as base

# Set environment variables to bypass interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=America/New_York

# Install necessary system packages
RUN apt-get update && apt-get install --no-install-recommends -y \
    build-essential \
    libpq-dev \
    gcc \
    python3-dev \
    curl \
    xvfb \
    x11vnc \
    websockify \
    git \
    wget \
    gnupg \
    procps \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libxcomposite1 \
    libxrandr2 \
    libxdamage1 \
    libxfixes3 \
    libxshmfence1 \
    libdrm2 \
    tesseract-ocr \
    poppler-utils \
    dbus \
    && rm -rf /var/lib/apt/lists/*


# Install Poetry
RUN pip install --no-cache-dir poetry numpy

# Copy the pyproject.toml and poetry.lock files
COPY pyproject.toml poetry.lock* /app/

WORKDIR /app

# Install dependencies via Poetry
RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi

RUN playwright install --with-deps chromium

# Install NoVNC
RUN git clone https://github.com/novnc/noVNC.git /opt/novnc && \
    git clone https://github.com/novnc/websockify /opt/novnc/utils/websockify && \
    chmod +x /opt/novnc/utils/novnc_proxy

# Expose the NoVNC and VNC ports
EXPOSE 8000 6080 5900

# Set environment variables for display
ENV DISPLAY=:99
ENV DISPLAY_NUM=99
ENV GEOMETRY=1280x800
ENV SCREEN_DPI=96

# Copy your application code into the container
COPY . /app

# Start Xvfb, x11vnc (without password), novnc_proxy, and run your FastAPI app
CMD sh -c "\
    pkill Xvfb || true && \
    pkill x11vnc || true && \
    pkill novnc_proxy || true && \
    rm -rf /tmp/.X11-unix/* && \
    nohup Xvfb $DISPLAY -screen 0 ${GEOMETRY}x24 -dpi $SCREEN_DPI +extension RANDR >/dev/null 2>&1 & \
    sleep 2 && \
    nohup x11vnc -display $DISPLAY -forever -shared -rfbport 5900 -nopw >/dev/null 2>&1 & \
    sleep 2 && \
    /opt/novnc/utils/novnc_proxy --vnc localhost:5900 --listen 6080 & \
    uvicorn app.main:app --host 0.0.0.0 --port 8000"