import sys
import os
import time
import subprocess
import psutil
from src.powerpulse.monitor import SystemMonitor

def create_dummy_process_tree():
    # Create a parent process that spawns a child
    # using python -c to sleep
    code = "import subprocess, time; subprocess.Popen(['python', '-c', 'import time; time.sleep(60)']); time.sleep(60)"
    p = subprocess.Popen([sys.executable, "-c", code])
    time.sleep(1) # Give it time to spawn child
    return p

def verify_fix():
    print("Starting verification for 'Kill Process + Children' fix...")
    monitor = SystemMonitor()
    
    # 1. Create process tree
    print("Creating dummy process tree...")
    proc = create_dummy_process_tree()
    pid = proc.pid
    print(f"Parent PID: {pid}")
    
    try:
        parent = psutil.Process(pid)
        children = parent.children(recursive=True)
        print(f"Children PIDs: {[c.pid for c in children]}")
    except psutil.NoSuchProcess:
        print("Error: Process died too early!")
        return

    # 2. Measure Kill Time
    print(f"Terminating tree for PID {pid}...")
    start_time = time.time()
    
    success, msg = monitor.terminate_process_tree(pid)
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"Result: {success}, Message: {msg}")
    print(f"Time taken: {duration:.4f} seconds")
    
    # 3. Verify PIDs are gone
    if psutil.pid_exists(pid):
        print(f"FAILURE: Parent PID {pid} still exists!")
    else:
        print(f"SUCCESS: Parent PID {pid} is gone.")
        
    for child in children:
        if psutil.pid_exists(child.pid):
            print(f"FAILURE: Child PID {child.pid} still exists!")
        else:
            print(f"SUCCESS: Child PID {child.pid} is gone.")

    if duration < 1.0:
        print("\nPERFORMANCE: Excellent (<1s)")
    elif duration < 2.0:
        print("\nPERFORMANCE: Acceptable (<2s)")
    else:
        print("\nPERFORMANCE: Slow (>2s) - Optimization might be needed")

if __name__ == "__main__":
    verify_fix()
