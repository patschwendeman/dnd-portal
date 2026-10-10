# Set image
FROM python:3.11-slim

# Set work dir
WORKDIR /app

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code in work dir
COPY . /app 

# Define port
EXPOSE 8000

# Run app (no reload; the dev compose file adds --reload via command)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
