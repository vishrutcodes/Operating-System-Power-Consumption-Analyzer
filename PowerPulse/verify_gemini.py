import requests
import json
import os
from pathlib import Path
from dotenv import load_dotenv

# Try to find .env explicitly
env_path = Path('.') / '.env'
print(f"Looking for .env at: {env_path.absolute()}")
if env_path.exists():
    print(f".env exists. Content length: {len(env_path.read_text())}")
else:
    print(".env NOT found at this path.")

load_dotenv(dotenv_path=env_path)
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("WARNING: GEMINI_API_KEY not found in environment after loading .env")
elif "YOUR_API_KEY" in api_key:
    print("WARNING: GEMINI_API_KEY is still the placeholder value.")
else:
    print(f"GEMINI_API_KEY found (length: {len(api_key)})")

url = "http://127.0.0.1:8001/api/ai/analyze"
payload = {
    "prompt": "Test analysis",
    "snapshot": {
        "data": {
            "cpu": {"usage_percent": 15.5},
            "memory": {"percent": 45.2},
            "processes": [{"name": "test_proc", "cpu_percent": 5.0}]
        }
    }
}

print(f"\nSending request to {url}...")
try:
    resp = requests.post(url, json=payload, timeout=20)
    with open("verify_result.txt", "w", encoding="utf-8") as f:
        f.write(f"Status Code: {resp.status_code}\n")
        f.write("Raw Response Text:\n")
        f.write(resp.text[:1000])
        f.write("\n")
        
        try:
            data = resp.json()
            if "summary" in data:
                f.write("\n✅ SUCCESS: API returned structured analysis.\n")
                f.write(json.dumps(data, indent=2))
            elif "result" in data:
                 f.write(f"\nℹ️ Result: {data['result']}\n")
        except:
            pass

except Exception as e:
    print(f"Request failed: {e}")
