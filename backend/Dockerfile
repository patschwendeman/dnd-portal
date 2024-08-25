# Wähle das Basis-Image für Python
FROM python:3.11

# Setze das Arbeitsverzeichnis
WORKDIR /app

# Kopiere die Anforderungen und installiere sie
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Kopiere den Anwendungscode
COPY ./app /app

# Starte die FastAPI-Anwendung
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]