# ─── Stage 1: Build ───────────────────────────────────────────
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the frontend source
COPY . .

# Build arguments for environment variables (Vite needs these at build time)
ARG VITE_API_URL
ARG VITE_RPC_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_RPC_URL=$VITE_RPC_URL

# Build the production bundle
RUN npm run build

# ─── Stage 2: Serve with Nginx ────────────────────────────────
FROM nginx:stable-alpine

# Copy the build output from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Run Nginx
CMD ["nginx", "-g", "daemon off;"]

