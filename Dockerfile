FROM rust:1.82-bookworm AS builder

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install Tauri system dependencies
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.1-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install npm deps
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Build the Tauri app
RUN npm run tauri build

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.1-0 \
    libgtk-3-0 \
    libayatana-appindicator3-1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/src-tauri/target/release/bundle /app/bundle
WORKDIR /app
