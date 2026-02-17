import requests
import time

url = "http://127.0.0.1:8000/api/ai/analyze"
print("Testing Local Fallback Definition...")

# This should trigger fallback if we don't have a valid key, OR we can rely on my previous knowledge that fallback is active.
# To force fallback, we can't easily break the key without restarting. 
# But the user IS hitting fallback (due to quota).
# I'll just check if the response contains the definition of OS.

payload = {
    "prompt": "define operating system",
    "snapshot": {
        "data": {"cpu": {"usage_percent": 10}, "processes": []}
    }
}

try:
    r = requests.post(url, json=payload, timeout=10)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text[:200]}")
    
    if "manages computer hardware" in r.text or "software resources" in r.text:
        print("✅ SUCCESS: Found OS definition in response!")
    else:
        print("❌ FAILURE: Definition not found.")
        
except Exception as e:
    print(f"Test Failed: {e}")
