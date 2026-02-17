import argparse
import time
import csv
import sys
from rich.live import Live
from rich.console import Console
from .monitor import SystemMonitor
from .ui import Dashboard

def run_export(filename: str, duration: int = 60):
    console = Console()
    monitor = SystemMonitor()
    data_rows = []
    
    console.print(f"[bold yellow]Starting {duration}-second data collection...[/bold yellow]")
    
    start_time = time.time()
    try:
        while time.time() - start_time < duration:
            timestamp = time.strftime("%H:%M:%S")
            battery = monitor.get_battery_info()
            cpu = monitor.get_cpu_info()
            # For CSV, maybe we just want system stats + top process? 
            # Or just system stats?
            # Let's simple capture system stats + name of top process
            top_procs = monitor.get_top_processes(1)
            top_proc_name = top_procs[0].name if top_procs else "N/A"
            top_proc_score = top_procs[0].power_score if top_procs else 0.0
            
            row = {
                "Timestamp": timestamp,
                "Battery_%": battery.percent,
                "Power_Watts": battery.power_watts if battery.power_watts else 0,
                "CPU_Freq": cpu.frequency_current,
                "CPU_Usage": cpu.usage_percent,
                "Top_Process": top_proc_name,
                "Top_Proc_Score": top_proc_score
            }
            data_rows.append(row)
            
            # Simple progress
            elapsed = int(time.time() - start_time)
            sys.stdout.write(f"\rCollecting: {elapsed}/{duration}s")
            sys.stdout.flush()
            
            time.sleep(1)
    except KeyboardInterrupt:
        console.print("\n[bold red]Collection interrupted![/bold red]")
        return

    print() # Newline
    
    # Write to CSV
    if data_rows:
        keys = data_rows[0].keys()
        try:
            with open(filename, 'w', newline='') as f:
                dict_writer = csv.DictWriter(f, fieldnames=keys)
                dict_writer.writeheader()
                dict_writer.writerows(data_rows)
            console.print(f"[bold green]Data exported to {filename}[/bold green]")
        except IOError as e:
            console.print(f"[bold red]Error writing file: {e}[/bold red]")

def run_dashboard():
    monitor = SystemMonitor()
    dashboard = Dashboard()
    
    # Initial data
    battery = monitor.get_battery_info()
    cpu = monitor.get_cpu_info()
    processes = monitor.get_top_processes()
    dashboard.update(battery, cpu, processes)

    with Live(dashboard.get_layout(), refresh_per_second=4, screen=True) as live:
        while True:
            try:
                battery = monitor.get_battery_info()
                cpu = monitor.get_cpu_info()
                processes = monitor.get_top_processes()
                
                dashboard.update(battery, cpu, processes)
                time.sleep(1) # psutil cpu_percent(interval=None) needs time between calls usually, 
                # but monitor.py calls it non-blocking. 
                # Ideally we sleep here.
            except KeyboardInterrupt:
                break

def main():
    parser = argparse.ArgumentParser(description="PowerPulse - Real-time Power Monitor")
    parser.add_argument("--export", help="Export a snapshot to the specified CSV filename")
    parser.add_argument("--duration", type=int, default=60, help="Duration in seconds for export (default: 60)")
    
    args = parser.parse_args()
    
    if args.export:
        run_export(args.export, args.duration)
    else:
        run_dashboard()

if __name__ == "__main__":
    main()
