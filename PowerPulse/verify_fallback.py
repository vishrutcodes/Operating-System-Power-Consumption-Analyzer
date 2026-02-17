import requests
import json
import time

url = "http://127.0.0.1:8001/api/ai/analyze"
payload = {
    "prompt": "Test fallback",
    "snapshot": {
        "data": {
            "cpu": {"usage_percent": 85},
            "memory": {"percent": 90},
            "processes": [{"name": "stress_test.exe", "cpu_percent": 50.0}, {"name": "chrome.exe", "cpu_percent": 10.0}]
        }
    }
}

print(f"Sending request to {url}...")
# Note: For this to test fallback, the backend needs to fail Gemini auth or hit rate limit.
# Since we can't easily force rate limit, we rely on the fact that if we corrupt the key in the env it would fail.
# But here we just test that it returns SOMETHING valid.

try:
    resp = requests.post(url, json=payload, timeout=60)
    print(f"Status: {resp.status_code}")
    try:
        data = resp.json()
        print("Summary:", data.get("summary"))
        print("Raw:", data.get("raw"))
        if "Local Fallback" in data.get("raw", ""):
            print("✅ SUCCESS: Local Fallback Triggered!")
        else:
            print("ℹ️ Response came from Gemini (or elsewhere).")
            
    except Exception as e:
        print(f"JSON Parse Error: {e}")
        print("Response Text:", resp.text)

except Exception as e:
    print(f"Request Failed: {e}")
