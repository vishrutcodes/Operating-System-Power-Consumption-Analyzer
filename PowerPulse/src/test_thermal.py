import sys
import os

# Add the current directory to path so we can import modules
sys.path.append(os.getcwd())

try:
    from powerpulse.monitor import SystemMonitor
    print("Import successful")
    m = SystemMonitor()
    print("Monitor initialized")
    info = m.get_thermal_info()
    print("Thermal Info:", info)
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
