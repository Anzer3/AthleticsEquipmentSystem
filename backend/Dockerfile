FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "python wait_for_postgres.py && yes | python manage.py makemigrations && python manage.py migrate --no-input && python manage.py initadmin && python manage.py runserver 0.0.0.0:8000"]
