import sys
import os
import time

# Add path
sys.path.append(os.getcwd())

print("--- Starting Full Stack Test ---")

try:
    print("1. Importing modules...")
    from powerpulse.monitor import SystemMonitor
    from powerpulse import database
    print("   Modules imported.")

    print("2. Initializing Database...")
    try:
        database.init_db()
        print("   Database initialized.")
    except Exception as e:
        print(f"   !!! Database Init Failed: {e}")
        import traceback
        traceback.print_exc()

    print("3. Initializing Monitor...")
    monitor = SystemMonitor()
    print("   Monitor initialized.")

    print("4. Fetching Thermal Info...")
    try:
        thermal = monitor.get_thermal_info()
        print(f"   Thermal Info: Available={thermal.get('available')}")
        # print(thermal) # Keep it clean
    except Exception as e:
        print(f"   !!! get_thermal_info Failed: {e}")
        traceback.print_exc()

    print("5. Logging Metrics (DB Write Test)...")
    try:
        # Mock other data
        cpu = 10.0
        mem = 50.0
        batt = 100.0
        net_s = 0; net_r = 0
        disk_r = 0; disk_w = 0
        t_max = thermal.get("max_temp", 0)
        t_avg = thermal.get("avg_temp", 0)

        database.log_metrics(
            cpu, mem, batt, net_s, net_r, disk_r, disk_w, t_max, t_avg
        )
        print("   Metrics logged successfully.")
    except Exception as e:
        print(f"   !!! log_metrics Failed: {e}")
        import traceback
        traceback.print_exc()

    print("--- Test Complete: Success ---")

except Exception as e:
    print(f"--- Test Crashed: {e} ---")
    import traceback
    traceback.print_exc()
