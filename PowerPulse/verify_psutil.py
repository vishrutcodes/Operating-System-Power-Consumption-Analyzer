import psutil
import os
import sys

print(f"User: {os.getlogin()}")
print(f"My PID: {os.getpid()}")

def check(pid, name=None):
    try:
        p = psutil.Process(pid)
        print(f"\n--- PID {pid} ({name or p.name()}) ---")
        try:
            print(f"Threads: {p.num_threads()}")
        except Exception as e:
            print(f"Threads Error: {e}")
            
        try:
            if hasattr(p, 'num_handles'):
                print(f"Handles: {p.num_handles()}")
            else:
                print("Handles: Not supported (Unix?)")
        except Exception as e:
            print(f"Handles Error: {e}")
            
        try:
            ctx = p.num_ctx_switches()
            print(f"Ctx Switches: {ctx}")
        except Exception as e:
            print(f"Ctx Switches Error: {e}")
            
        try:
            print(f"Status: {p.status()}")
        except Exception as e:
            print(f"Status Error: {e}")

    except Exception as e:
        print(f"Init Error: {e}")

# Check self
check(os.getpid(), "python (self)")

# Find explorer and system
targets = ["explorer.exe", "System", "svchost.exe", "taskmgr.exe"]
found_map = {}

for p in psutil.process_iter(['pid', 'name']):
    n = p.info['name']
    if n in targets and n not in found_map:
        check(p.pid, n)
        found_map[n] = True
        if len(found_map) >= len(targets):
            break
