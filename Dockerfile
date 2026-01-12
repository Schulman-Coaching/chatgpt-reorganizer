# Use Node with Puppeteer support
FROM ghcr.io/puppeteer/puppeteer:24.0.0

# Build argument for database URL (needed for Next.js build)
ARG DATABASE_URL

# Set working directory
WORKDIR /app

# Switch to root to install dependencies
USER root

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy Prisma files and generate client
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Set DATABASE_URL for build
ENV DATABASE_URL=$DATABASE_URL

# Build the Next.js application
RUN npm run build

# Puppeteer in this image auto-detects Chrome, no path needed
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Expose port
EXPOSE 3000

# Set the port for Railway
ENV PORT=3000

# Start the application
CMD ["npm", "start"]
