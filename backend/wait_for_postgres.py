import socket
import time
import os

# host PostgreSQL kontejneru – v Docker Compose je obvykle název servisu
host = os.environ.get("DB_HOST", "db")  # fallback "db" pokud env není nastaven
port = 5432

print(f"Waiting for PostgreSQL on {host}:{port}...")

while True:
    try:
        with socket.create_connection((host, port), timeout=1):
            print("PostgreSQL is up!")
            break
    except (OSError, ConnectionRefusedError):
        print("Connection refused, retrying in 2s...")
        time.sleep(2)
