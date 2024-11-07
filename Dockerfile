# Use the official Node.js image as the base
FROM node:22-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:22-slim AS runner

ENV DEBIAN_FRONTEND=noninteractive TZ=America/New_York DISPLAY=:99 \
    DISPLAY_NUM=99 GEOMETRY=1280x800 SCREEN_DPI=96


RUN apt-get update && apt-get install --no-install-recommends -y \
    xvfb x11vnc websockify git wget procps \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libxkbcommon0 libatspi2.0-0 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 libxcomposite1 \
    libxrandr2 libxdamage1 libxfixes3 libxshmfence1 \
    libdrm2 dbus ca-certificates \
    && git clone --depth=1 https://github.com/novnc/noVNC.git /opt/novnc \
    && git clone --depth=1 https://github.com/novnc/websockify /opt/novnc/utils/websockify \
    && chmod +x /opt/novnc/utils/novnc_proxy \
    && apt-get purge -y git \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates


WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

RUN npx playwright install --with-deps chromium

# Start Xvfb, x11vnc, NoVNC, and your Next.js app
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
    npm start"
