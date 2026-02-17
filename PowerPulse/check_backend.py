import requests
import time

print("Checking backend on port 8000...")
try:
    # Check root first
    r = requests.get("http://127.0.0.1:8000/", timeout=5)
    print(f"Root check: {r.status_code}")
    
    # Check AI endpoint
    url = "http://127.0.0.1:8000/api/ai/analyze"
    payload = {"prompt": "test", "snapshot": {"data": {}}}
    r = requests.post(url, json=payload, timeout=10)
    print(f"AI check: {r.status_code}")
    print(f"Response: {r.text[:100]}")
    
except Exception as e:
    print(f"Failed: {e}")
