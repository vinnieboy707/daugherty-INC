# Frontend Dockerfile
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_CONTACT_PHONE
ARG VITE_CONTACT_EMAIL
ARG VITE_CONTACT_INSTAGRAM
ARG VITE_CONTACT_LOCATION

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_CONTACT_PHONE=${VITE_CONTACT_PHONE}
ENV VITE_CONTACT_EMAIL=${VITE_CONTACT_EMAIL}
ENV VITE_CONTACT_INSTAGRAM=${VITE_CONTACT_INSTAGRAM}
ENV VITE_CONTACT_LOCATION=${VITE_CONTACT_LOCATION}

# Build application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
