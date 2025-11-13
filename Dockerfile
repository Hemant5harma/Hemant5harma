# Build Stage
FROM node:latest as build-stage

WORKDIR /frontend

# Accept API base URL as build-time argument (defaults to localhost)
ARG REACT_APP_API_BASE_URL=http://localhost:8000
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
# Use --legacy-peer-deps to allow TypeScript 5.x with react-scripts 5.0.1
RUN npm install --legacy-peer-deps

# Copy the rest of the application files to the working directory
COPY . .

# Ensure Node has a writable localStorage path during the production build (Node 20+ requirement)
ENV NODE_OPTIONS="--localstorage-file=/tmp/localStorage.json"

# Build the React application with the injected env variable
# Disable ESLint plugin during build to prevent warnings from failing the build
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build

# Production Stage
FROM nginx:latest

# Copy the NGINX configuration file
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build artifacts from the build stage to NGINX web server
COPY --from=build-stage /frontend/build/ /usr/share/nginx/html

# We need to make sure not to run the container as a non root user
# for better security
WORKDIR /frontend
RUN chown -R nginx:nginx /frontend && chmod -R 755 /frontend && \
        chown -R nginx:nginx /var/cache/nginx && \
        chown -R nginx:nginx /var/log/nginx && \
        chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && \
        chown -R nginx:nginx /var/run/nginx.pid

USER nginx

# Expose port 80 for the NGINX server
EXPOSE 80

# Command to start NGINX when the container is run
CMD ["nginx", "-g", "daemon off;"]