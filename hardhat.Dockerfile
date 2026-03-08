# ─── Blockchain: Hardhat Local Node ────────────────────────────
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package files (hardhat config + smart contract deps)
COPY package.json package-lock.json ./
RUN npm ci

# Copy Hardhat config, contracts, scripts, and deployed artifacts
COPY hardhat.config.js ./
COPY contracts/ ./contracts/
COPY scripts/ ./scripts/
COPY deployed.json ./

# Expose the Hardhat RPC port
EXPOSE 8545

# Start the Hardhat local node
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
