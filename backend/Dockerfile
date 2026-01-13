FROM python:3.11-slim

# Prevents Python from writing pyc files to disc and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies required for building Python packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code into the container
COPY . /app

# Make the wait-for-db script executable
RUN chmod +x /app/scripts/wait-for-db.py

# Create a startup script that waits for database and then starts the app
RUN echo '#!/bin/bash\n\
echo "🚀 Starting Trading Bot Backend..."\n\
python scripts/wait-for-db.py\n\
if [ $? -eq 0 ]; then\n\
    echo "✅ Database is ready, starting FastAPI server..."\n\
    uvicorn src.api.main:app --host 0.0.0.0 --port 8000\n\
else\n\
    echo "❌ Database connection failed, exiting..."\n\
    exit 1\n\
fi' > /app/start.sh && chmod +x /app/start.sh

# Expose FastAPI port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the application using our custom script
CMD ["/app/start.sh"] 