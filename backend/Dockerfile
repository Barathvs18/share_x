# ─── Backend + Blockchain: FastAPI & Hardhat ───────────────────
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies + Node.js
# We need Node.js to run the Hardhat blockchain node and deploy contracts
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy root dependency files first for layer caching
# This includes both smart contract (npm) and backend (pip) requirements
COPY package.json package-lock.json ./
RUN npm ci

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend source (now includes blockchain folder files)
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose ports:
#   8000: FastAPI Backend
#   8545: Hardhat Blockchain Node
EXPOSE 8000
EXPOSE 8545

# Create a startup script that runs both the Hardhat node and the FastAPI server
# It also auto-deploys the smart contract on startup
RUN echo '#!/bin/sh\n\
echo "🟠 Starting Hardhat Blockchain Node..." \n\
npx hardhat node --hostname 0.0.0.0 > hardhat.log 2>&1 & \n\
\n\
echo "⏳ Waiting for Hardhat node to initialize..." \n\
sleep 8 \n\
\n\
echo "📦 Deploying Smart Contract..." \n\
npx hardhat run scripts/deploy.js --network localhost \n\
\n\
echo "🟢 Starting FastAPI Backend..." \n\
uvicorn main:app --host 0.0.0.0 --port 8000' > /app/start.sh \
    && chmod +x /app/start.sh

# Use the startup script as the entrypoint
CMD ["/app/start.sh"]
