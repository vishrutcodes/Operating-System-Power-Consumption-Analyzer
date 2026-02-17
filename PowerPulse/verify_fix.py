import requests
import time
import sys

# Try both ports just in case
ports = [8000, 8001]
target_definition = "An Operating System (OS) is system software"

for port in ports:
    url = f"http://127.0.0.1:{port}/api/ai/analyze"
    print(f"Checking Port {port}...")
    try:
        payload = {
            "prompt": "define operating system",
            "snapshot": {"data": {"cpu": {"usage_percent": 10}, "processes": []}}
        }
        r = requests.post(url, json=payload, timeout=5)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            print(f"Response: {r.text[:100]}...")
            if target_definition in r.text:
                print(f"✅ SUCCESS on Port {port}: Correct Definition Returned!")
                sys.exit(0)
            else:
                 print(f"❌ FAILURE on Port {port}: Wrong answer (Stats returned instead of definition).")
        else:
            print(f"❌ ERROR on Port {port}: Status {r.status_code}")
    except Exception as e:
        print(f"Port {port} unreachable: {e}")

print("\n❌ FINAL RESULT: Could not get correct answer from either port.")
sys.exit(1)
