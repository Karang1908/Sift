FROM python:3.11-slim

# Install system dependencies for document parsing and OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libtesseract-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Run Uvicorn on port 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
