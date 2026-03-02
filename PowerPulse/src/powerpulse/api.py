from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from dataclasses import asdict
from typing import Optional, List
from pydantic import BaseModel
from .monitor import SystemMonitor
from . import database
import os
import math
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()


app = FastAPI(title="PowerPulse API")
# Trigger reload for thermal updates

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

monitor = SystemMonitor()

# Background Task for Logging
async def log_metrics_loop():
    while True:
        try:
            # Gather data
            cpu = monitor.get_cpu_info().usage_percent
            mem = monitor.get_top_processes(1)[0].memory_percent if monitor.get_top_processes(1) else 0 # Rough proxy if needed, or query psutil again.
            # Actually monitor doesn't expose global mem usage directly in a simple method yet, let's add it or use psutil here.
            # Best to use monitor. But monitor.get_system_score uses mem.
            # Let's peek at psutil directly here or add get_memory_info to monitor?
            # Creating a quick helper here is easier.
            import psutil
            mem_usage = psutil.virtual_memory().percent
            
            batt = monitor.get_battery_info().percent
            net = monitor.get_network_io()
            disk = monitor.get_disk_io()
            thermal = monitor.get_thermal_info()
            
            database.log_metrics(
                cpu, mem_usage, batt,
                net.bytes_sent, net.bytes_recv,
                disk.read_bytes, disk.write_bytes,
                thermal["max_temp"], thermal["avg_temp"]
            )
            
            # Prune occasionally
            database.prune_old_data()
            
        except Exception as e:
            print(f"Logging Error: {e}")
            
        await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    database.init_db()
    asyncio.create_task(log_metrics_loop())

@app.get("/api/history")
async def get_history(hours: int = 24):
    raw_data = database.get_history(hours)
    
    # Process raw cumulative counters into rates
    processed = []
    
    for i in range(1, len(raw_data)):
        prev = raw_data[i-1]
        curr = raw_data[i]
        
        time_diff = curr['timestamp'] - prev['timestamp']
        if time_diff <= 0: continue
        
        processed.append({
            "timestamp": curr['timestamp'],
            "cpu": curr['cpu_usage'],
            "memory": curr['memory_usage'],
            "battery": curr['battery_percent'],
            "thermal_max": curr['thermal_max_temp'] if 'thermal_max_temp' in curr.keys() else 0,
            "thermal_avg": curr['thermal_avg_temp'] if 'thermal_avg_temp' in curr.keys() else 0,
            "net_sent_rate": (curr['net_bytes_sent'] - prev['net_bytes_sent']) / time_diff,
            "net_recv_rate": (curr['net_bytes_recv'] - prev['net_bytes_recv']) / time_diff,
            "disk_read_rate": (curr['disk_bytes_read'] - prev['disk_bytes_read']) / time_diff,
            "disk_write_rate": (curr['disk_bytes_write'] - prev['disk_bytes_write']) / time_diff
        })
        
    return processed

@app.websocket("/ws/metrics")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Gather metrics
            battery = monitor.get_battery_info()
            cpu = monitor.get_cpu_info()
            cpu_cores = monitor.get_per_core_usage()
            disk_io = monitor.get_disk_io()
            net_io = monitor.get_network_io()
            score = monitor.get_system_score()
            suggestions = monitor.get_suggestions()
            uptime = monitor.get_uptime()
            sys_info = monitor.get_sys_info()
            mem_info = monitor.get_memory_info()
            swap_info = monitor.get_swap_info()
            disk_partitions = monitor.get_disk_partitions()
            thermal_info = monitor.get_thermal_info()
            
            # Get more processes for the process list page
            procs = monitor.get_top_processes(50)
            
            sys_info_dict = asdict(sys_info)
            if sys_info_dict.get("load_avg") is not None:
                sys_info_dict["load_avg"] = list(sys_info_dict["load_avg"])
            
            payload = {
                "battery": asdict(battery),
                "cpu": asdict(cpu),
                "memory": mem_info,
                "cpu_cores": cpu_cores,
                "disk_io": asdict(disk_io),
                "net_io": asdict(net_io),
                "processes": [asdict(p) for p in procs],
                "health_score": score,
                "suggestions": suggestions,
                "uptime": uptime,
                "sys_info": sys_info_dict,
                "swap": swap_info,
                "disk_partitions": disk_partitions,
                "thermal": thermal_info,
            }
            
            await websocket.send_json(payload)
            await asyncio.sleep(1)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        # Check if already closed
        try:
            await websocket.close()
        except:
            pass

@app.post("/api/process/{pid}/kill")
async def kill_process(pid: int):
    try:
        success, msg = monitor.terminate_process(pid)
        return {"success": success, "message": msg}
    except Exception as e:
        print(f"kill_process error: {e}")
        return {"success": False, "message": str(e)}

@app.post("/api/process/{pid}/force-kill")
async def force_kill_process(pid: int):
    """Force kill a process immediately - window closes instantly, no chance to save."""
    try:
        success, msg = monitor.force_kill_process(pid)
        return {"success": success, "message": msg}
    except Exception as e:
        print(f"force_kill_process error: {e}")
        return {"success": False, "message": str(e)}

@app.post("/api/process/{pid}/suspend")
def suspend_process(pid: int):
    try:
        success, msg = monitor.suspend_process(pid)
        data = None
        if success:
            try:
                details = monitor.get_process_details(pid)
                data = details
            except Exception:
                data = None
        return {"success": success, "message": msg, "data": data}
    except Exception as e:
        print(f"suspend_process error: {e}")
        return {"success": False, "message": str(e)}

@app.post("/api/process/{pid}/resume")
def resume_process(pid: int):
    try:
        success, msg = monitor.resume_process(pid)
        data = None
        if success:
            try:
                details = monitor.get_process_details(pid)
                data = details
            except Exception:
                data = None
        return {"success": success, "message": msg, "data": data}
    except Exception as e:
        print(f"resume_process error: {e}")
        return {"success": False, "message": str(e)}

class AffinityRequest(BaseModel):
    cores: list[int]

@app.post("/api/process/{pid}/affinity")
def set_affinity(pid: int, req: AffinityRequest):
    try:
        success, msg = monitor.set_process_affinity(pid, req.cores)
        return {"success": success, "message": msg, "data": {"cpu_affinity": req.cores} if success else None}
    except Exception as e:
        print(f"set_affinity error: {e}")
        return {"success": False, "message": str(e)}

class PriorityRequest(BaseModel):
    priority: str

@app.post("/api/process/{pid}/priority")
def set_priority(pid: int, req: PriorityRequest):
    try:
        success, msg = monitor.set_process_priority(pid, req.priority)
        return {"success": success, "message": msg, "data": {"priority": req.priority} if success else None}
    except Exception as e:
        print(f"set_priority error: {e}")
        return {"success": False, "message": str(e)}

# Literal path must come before /api/process/{pid}/... so "tree" is not captured as pid
@app.get("/api/process/tree")
def get_process_tree(root: Optional[int] = None):
    try:
        tree = monitor.get_process_tree(root_pid=root)
        return {"success": True, "tree": tree}
    except Exception as e:
        print(f"get_process_tree error: {e}")
        return {"success": False, "message": str(e), "tree": []}

@app.get("/api/process/{pid}/details")
def get_process_details(pid: int):
    try:
        details = monitor.get_process_details(pid)
        if details:
            return {"success": True, "data": details}
        return {"success": False, "message": "Could not fetch details"}
    except Exception as e:
        print(f"get_process_details error: {e}")
        return {"success": False, "message": str(e)}

@app.post("/api/process/{pid}/kill-tree")
def kill_process_tree(pid: int):
    success, msg = monitor.terminate_process_tree(pid)
    return {"success": success, "message": msg}

@app.post("/api/process/{pid}/force-kill-tree")
def force_kill_process_tree(pid: int):
    """Force kill process tree instantly - for resistant browsers like Edge."""
    success, msg = monitor.force_kill_process_tree(pid)
    return {"success": success, "message": msg}

# ── AI Assistant (Gemini 2.5 Flash) ──────────────────────────────

class ChatMessage(BaseModel):
    role: str   # "user" or "model"
    text: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

SYSTEM_PROMPT = """You are PowerPulse AI Assistant, an expert on Operating System concepts and the PowerPulse – Operating System Power Consumption Analyzer application.

YOUR SCOPE (answer ONLY about these topics):
• Operating System fundamentals: processes, threads, CPU scheduling (FCFS, SJF, SRTF, Round Robin, Priority), context switching, inter-process communication
• Memory management: paging, segmentation, virtual memory, page replacement algorithms, cache, TLB
• File systems, disk I/O, disk scheduling algorithms
• Power management, ACPI, CPU frequency scaling, thermal throttling
• System monitoring: CPU usage, memory usage, swap, battery, network I/O, disk I/O
• The PowerPulse application features: Dashboard (real-time metrics), Insights (health score, suggestions), Processes (kill/suspend/resume/priority/affinity), Resources (CPU cores, memory, network, disk), History (logged metrics over time), Reports (printable system reports), Kernel Lab (OS experiments), Benchmarks (performance tests), Thermal Monitor (temperature tracking), CPU Scheduler Simulator (FCFS, SJF, SRTF, RR, Priority scheduling), Settings (theme, alerts)

RULES:
1. If the user asks something outside of Operating Systems or this application, politely decline and redirect them to OS topics.
2. When live system data is provided below, use it to give specific, personalized answers (e.g. "Your CPU is at 45%").
3. Format responses in Markdown: use **bold**, bullet lists, and code blocks where appropriate.
4. Be concise and educational. Relate answers to real-world system behavior when possible.
5. If asked "what can you do?", describe your capabilities within the scope above.
"""

@app.post("/api/chat")
async def chat_with_ai(req: ChatRequest):
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {"success": False, "reply": "Gemini API key not configured. Please add GEMINI_API_KEY to the .env file."}

        # Gather live system snapshot for context
        try:
            battery = monitor.get_battery_info()
            cpu = monitor.get_cpu_info()
            mem_info = monitor.get_memory_info()
            thermal = monitor.get_thermal_info()
            score = monitor.get_system_score()
            top_procs = monitor.get_top_processes(5)
            swap = monitor.get_swap_info()

            live_context = f"""
LIVE SYSTEM DATA (current snapshot):
- CPU Usage: {cpu.usage_percent:.1f}% across {cpu.core_count} cores
- Memory: {mem_info.get('percent', 0):.1f}% used ({mem_info.get('used', 0) / (1024**3):.1f} GB / {mem_info.get('total', 0) / (1024**3):.1f} GB)
- Swap: {swap.get('percent', 0):.1f}% used
- Battery: {battery.percent:.0f}% {'(Charging)' if battery.power_plugged else '(On Battery)'}
- Thermal: Max {thermal.get('max_temp', 0):.0f}°C, Avg {thermal.get('avg_temp', 0):.0f}°C
- Health Score: {score}/100
- Top Processes by CPU: {', '.join(f"{p.name} ({p.cpu_percent:.1f}%)" for p in top_procs)}
"""
        except Exception:
            live_context = "\nLIVE SYSTEM DATA: Not available at the moment.\n"

        # Build Gemini contents list from history
        contents = []
        for msg in req.history:
            contents.append({
                "role": msg.role,
                "parts": [{"text": msg.text}]
            })

        # Add current user message
        contents.append({
            "role": "user",
            "parts": [{"text": req.message}]
        })

        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config={
                "system_instruction": SYSTEM_PROMPT + live_context,
                "temperature": 0.7,
                "max_output_tokens": 2048,
            }
        )

        reply = response.text if response.text else "I'm sorry, I couldn't generate a response. Please try again."
        return {"success": True, "reply": reply}

    except Exception as e:
        print(f"Chat error: {e}")
        return {"success": False, "reply": f"An error occurred: {str(e)}"}

@app.get("/")
def read_root():
    return {"message": "PowerPulse API is running. Connect to /ws/metrics for live data."}
