from powerpulse.monitor import SystemMonitor
import time

try:
    monitor = SystemMonitor()
    print("Monitor initialized.")
    
    # Needs a moment for CPU percent
    _ = monitor.get_cpu_info()
    time.sleep(1)
    
    batt = monitor.get_battery_info()
    cpu = monitor.get_cpu_info()
    procs = monitor.get_top_processes(3)
    
    print(f"Battery: {batt}")
    print(f"CPU: {cpu}")
    print(f"Top Process: {procs[0] if procs else 'None'}")
    print("Verification Successful!")
except Exception as e:
    print(f"Verification Failed: {e}")
