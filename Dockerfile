# ---------------------------------------
# Stage 1: The Builder (Compiles TypeScript)
# ---------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first to cache dependencies
COPY package*.json ./

# Install ALL dependencies (including devDependencies to get tsc)
RUN npm install

# Copy the rest of your source code
COPY . .

# Build the project (Compiles TS -> JS in 'dist' folder)
RUN npm run build

# ---------------------------------------
# Stage 2: The Runner (Tiny Production Image)
# ---------------------------------------
FROM node:20-alpine

WORKDIR /app

# Copy package.json again
COPY package*.json ./

# Install ONLY production dependencies (saves huge amount of space)
RUN npm install --production

# Copy the compiled 'dist' folder from the Builder stage
# We do NOT copy the source 'src' folder or heavy dev tools
COPY --from=builder /app/dist ./dist

# Start the app using your existing script
CMD ["npm", "start"]