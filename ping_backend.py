import time
import requests
import sys

# Update this with your actual backend URL from Render
URL = "https://aura-backend.onrender.com/health"

print(f"Aura Keep-Alive started for: {URL}")
print("This script will ping your backend every 10 minutes to prevent it from sleeping.")
print("Keep this terminal open to maintain the connection.")

def ping():
    try:
        response = requests.get(URL, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"[{time.strftime('%H:%M:%S')}] Backend is Alive! Latency: {data.get('db_latency_ms')}ms")
        else:
            print(f"[{time.strftime('%H:%M:%S')}] Warning: Received status {response.status_code}")
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] Error: {str(e)}")

if __name__ == "__main__":
    while True:
        ping()
        # Sleep for 10 minutes (600 seconds)
        # Render Free Tier sleeps after 15 minutes of inactivity
        time.sleep(600)
