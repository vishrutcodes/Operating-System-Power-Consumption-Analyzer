import sys
import os
import time
import subprocess
import psutil
from src.powerpulse.monitor import SystemMonitor

def create_hierarchy():
    # Parent (Python) -> Child (Python)
    # Both have same name 'python.exe' or 'python'
    # Parent Code
    code = """
import subprocess
import time
import sys
# Spawn child
subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(60)'])
time.sleep(60)
"""
    p = subprocess.Popen([sys.executable, "-c", code])
    time.sleep(2) # Allow child to spawn
    return p

def verify_smart_kill():
    print("Starting verification for SMART KILL...")
    monitor = SystemMonitor()
    
    # 1. Create hierarchy
    parent_proc = create_hierarchy()
    parent_pid = parent_proc.pid
    
    try:
        parent = psutil.Process(parent_pid)
        children = parent.children(recursive=True)
        if not children:
            print("Error: Child did not spawn.")
            return
        child_pid = children[0].pid
        print(f"Parent PID: {parent_pid}")
        print(f"Child PID: {child_pid}")
        
    except psutil.NoSuchProcess:
        print("Error: Process died too early!")
        return

    # 2. Target the CHILD
    print(f"Requesting kill on CHILD PID {child_pid}...")
    start_time = time.time()
    
    # Logic should detect parent has same name and kill parent too
    success, msg = monitor.terminate_process_tree(child_pid)
    
    end_time = time.time()
    
    print(f"Result: {success}, Message: {msg}")
    print(f"Time taken: {end_time - start_time:.4f}s")
    
    # 3. Verify PARENT is gone
    time.sleep(0.5) # Allow OS to cleanup
    if psutil.pid_exists(parent_pid):
        print(f"FAILURE: Parent PID {parent_pid} still exists! Smart kill failed to climb tree.")
    else:
        print(f"SUCCESS: Parent PID {parent_pid} is gone! Smart kill worked.")
        
    if psutil.pid_exists(child_pid):
        print(f"FAILURE: Child PID {child_pid} still exists!")
    else:
        print(f"SUCCESS: Child PID {child_pid} is gone.")

if __name__ == "__main__":
    try:
        verify_smart_kill()
    except Exception as e:
        import traceback
        traceback.print_exc()
