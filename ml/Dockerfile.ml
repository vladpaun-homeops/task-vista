FROM python:3.12-slim

WORKDIR /app
EXPOSE 8000

# Later you’ll add:
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt
# COPY . .
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
