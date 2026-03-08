# ─── Frontend: React + Vite (Dev Mode) ─────────────────────────
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the frontend source
COPY . .

# Expose the Vite dev server port
EXPOSE 3000

# Run Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
