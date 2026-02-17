import sqlite3
import time
import os
from typing import List, Dict, Any

DB_PATH = "metrics.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Create table if not exists with base schema
    c.execute('''
        CREATE TABLE IF NOT EXISTS metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp REAL,
            cpu_usage REAL,
            memory_usage REAL,
            battery_percent REAL,
            net_bytes_sent INTEGER,
            net_bytes_recv INTEGER,
            disk_bytes_read INTEGER,
            disk_bytes_write INTEGER
        )
    ''')
    
    # Check for new columns and migrate if needed
    c.execute("PRAGMA table_info(metrics)")
    columns = [info[1] for info in c.fetchall()]
    
    if "thermal_max_temp" not in columns:
        try:
            c.execute("ALTER TABLE metrics ADD COLUMN thermal_max_temp REAL")
            print("Database migrated: Added thermal_max_temp")
        except Exception as e:
            print(f"Migration warning max: {e}")

    if "thermal_avg_temp" not in columns:
        try:
            c.execute("ALTER TABLE metrics ADD COLUMN thermal_avg_temp REAL")
            print("Database migrated: Added thermal_avg_temp")
        except Exception as e:
            print(f"Migration warning avg: {e}")
            
    conn.commit()
    conn.close()

def log_metrics(cpu: float, mem: float, batt: float, net_sent: int, net_recv: int, disk_read: int, disk_write: int, thermal_max: float = 0, thermal_avg: float = 0):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        INSERT INTO metrics (timestamp, cpu_usage, memory_usage, battery_percent, net_bytes_sent, net_bytes_recv, disk_bytes_read, disk_bytes_write, thermal_max_temp, thermal_avg_temp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (time.time(), cpu, mem, batt, net_sent, net_recv, disk_read, disk_write, thermal_max, thermal_avg))
    conn.commit()
    conn.close()


def get_history(hours: int = 24) -> List[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    cutoff = time.time() - (hours * 3600)
    c.execute('SELECT * FROM metrics WHERE timestamp > ? ORDER BY timestamp ASC', (cutoff,))
    rows = c.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def prune_old_data(days: int = 7):
    """Delete metrics older than the specified number of days."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    cutoff = time.time() - (days * 86400)
    c.execute('DELETE FROM metrics WHERE timestamp < ?', (cutoff,))
    conn.commit()
    conn.close()
