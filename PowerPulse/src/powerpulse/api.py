from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from dataclasses import asdict
from typing import Optional, List
from pydantic import BaseModel
from .monitor import SystemMonitor
from . import database
import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai

# Resolve .env from project root (PowerPulse/) regardless of cwd
_project_root = Path(__file__).resolve().parents[2]  # src/powerpulse/api.py -> PowerPulse/
load_dotenv(_project_root / ".env")


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    asyncio.create_task(log_metrics_loop())
    yield

app = FastAPI(title="PowerPulse API", lifespan=lifespan)
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

# Startup logic moved to lifespan context manager above

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
            "thermal_max": curr['thermal_max_temp'] if 'thermal_max_temp' in curr else 0,
            "thermal_avg": curr['thermal_avg_temp'] if 'thermal_avg_temp' in curr else 0,
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
        except Exception:
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
    cores: List[int]

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

SYSTEM_PROMPT = """You are PowerPulse AI Assistant, an expert on Operating System concepts and the PowerPulse – Operating System Power Consumption Analyzer application. You have deep, detailed knowledge of every feature in PowerPulse.

═══════════════════════════════════════════
APPLICATION OVERVIEW
═══════════════════════════════════════════
PowerPulse is a real-time Operating System Power Consumption Analyzer built with:
- **Backend**: Python (FastAPI + psutil + WebSocket) – monitors CPU, memory, disk, network, battery, thermal data
- **Frontend**: React + Vite + Tailwind CSS + Recharts + Framer Motion
- **Database**: SQLite (metrics.db) – stores historical metrics every 60 seconds
- **AI**: Gemini 2.5 Flash (this assistant) for OS education and system analysis

═══════════════════════════════════════════
DETAILED PAGE-BY-PAGE FEATURES
═══════════════════════════════════════════

📊 **DASHBOARD** (path: /, shortcut: D)
- Real-time system overview updated every 1 second via WebSocket
- CPU usage gauge with percentage and core count
- Memory usage with used/total/available/cached/buffers
- Battery status: percentage, charging state, time remaining
- Network I/O: bytes sent/received rates (calculated as deltas)
- Disk I/O: read/write rates (calculated as deltas)
- Health Score: 0-100 composite metric based on CPU, memory, disk, battery
- Per-core CPU usage breakdown as individual bars
- Live-updating line charts for CPU history (last 60 samples)
- System info: OS name, kernel version, boot time, load average

🛡️ **INSIGHTS** (path: /insights, shortcut: I)
- **System Health Score**: Animated SVG gauge (0-100) with color coding (green ≥80, yellow ≥50, red <50)
- Health score algorithm: starts at 100, deducts points for high CPU (>80%), high memory (>85%), high disk (>90%), low battery (<20%), high swap (>50%)
- **Smart Advisor**: Auto-generated suggestions with severity levels (critical, warning, info, success)
- Suggestion examples: "CPU critical >90%", "Memory high >85%", "Disk partition >90% full", "Low battery <20%"
- **Health Trend Sparkline**: Mini SVG line chart of recent health scores
- **Battery Card**: Shows charging status, time remaining, low battery warnings
- **Load vs Cores**: Compares 1-minute load average against CPU core count, warns if overloaded
- **Did You Know?**: Rotating OS tips (e.g., "Closing unused browser tabs frees RAM")
- **Top Resource Hogs**: Lists top 5 processes by CPU% and top 5 by Memory%
- **Memory Breakdown**: Cards showing Used, Available, Cached, Buffers with formatted sizes (KB/MB/GB)
- **Swap Usage**: Total/Used/Free/Percent with warning if >50%
- **Disk Partitions Table**: Device, mount point, filesystem type, total/used/free/percent with color-coded alerts (≥90% critical, ≥80% warning)
- **System Info Cards**: OS info, kernel version, boot time, load average (1/5/15 min)

⚡ **PROCESSES** (path: /processes, shortcut: P)
- Lists up to 50 processes with: PID, name, CPU%, memory%, threads, handles, nice level, status
- **Search & Filter**: Filter by name, sort by any column
- **Process Actions** (per-process):
  - **Kill (Graceful)**: Sends SIGTERM, allows process to save data (POST /api/process/{pid}/kill)
  - **Force Kill**: Sends SIGKILL immediately, no save chance (POST /api/process/{pid}/force-kill)
  - **Kill Tree**: Terminates process and all children (POST /api/process/{pid}/kill-tree)
  - **Force Kill Tree**: Aggressive tree kill using Windows taskkill (POST /api/process/{pid}/force-kill-tree)
  - **Suspend**: Pauses process execution (POST /api/process/{pid}/suspend)
  - **Resume**: Resumes suspended process (POST /api/process/{pid}/resume)
  - **Set CPU Affinity**: Pin process to specific CPU cores (POST /api/process/{pid}/affinity)
  - **Set Priority**: Change priority level – idle, below_normal, normal, above_normal, high, realtime (POST /api/process/{pid}/priority)
- **Process Details Panel**: Shows detailed info including PID, name, status, CPU%, memory%, threads, handles, nice level, CPU affinity, I/O counters
- **Process Tree View**: Hierarchical parent-child view (GET /api/process/tree)
- Process statuses: running, sleeping, stopped, zombie, idle, disk_sleep

🖥️ **RESOURCES** (path: /resources, shortcut: R)
- **CPU Section**: Per-core usage bars, overall CPU%, frequency, core count
- **Memory Section**: Visual progress bar, used/total/available with percentage
- **Network Section**: Real-time sent/received rates with history chart
- **Disk Section**: Read/write rates with history chart
- All charts auto-update with WebSocket data

📈 **HISTORY** (path: /history, shortcut: H)
- Historical metrics stored in SQLite database (logged every 60 seconds)
- Configurable time range: 1h, 6h, 12h, 24h
- Charts for: CPU usage, memory usage, battery level, network rates, disk rates, thermal data
- Data from GET /api/history?hours=N endpoint
- Rates calculated from cumulative counters (bytes_sent diff / time_diff)

📄 **REPORTS** (path: /reports, shortcut: E)
- Generates printable system reports with current snapshot data
- Uses react-to-print for PDF/print output
- Report includes: system info header, CPU stats, memory breakdown, disk partitions, top processes, suggestions
- Formatted for print with proper page breaks, tables, and styling

🧪 **KERNEL LAB** (path: /kernel-lab, shortcut: K)
- Interactive OS concept experiments and visualizations
- Educational simulations demonstrating OS kernel concepts
- Experiments on memory management, process scheduling, etc.

📊 **BENCHMARKS** (path: /benchmarks, shortcut: B)
- Performance benchmarking tools for the system
- CPU benchmark tests with scoring
- Memory performance tests
- Disk I/O benchmarks
- Network throughput measurements
- Results displayed with charts and comparisons

🌡️ **THERMAL MONITOR** (path: /thermal, shortcut: T)
- Real-time CPU/system temperature monitoring
- Max temperature and average temperature tracking
- Temperature history chart over time
- Thermal throttling detection and warnings
- Uses platform-specific methods: Linux /sys/class/thermal, Windows WMI fallback
- Temperature data: max_temp, avg_temp, sensors list, is_throttling flag

📅 **CPU SCHEDULER SIMULATOR** (path: /scheduler, shortcut: X)
- Interactive CPU scheduling algorithm simulator
- **Supported Algorithms**:
  - **FCFS** (First Come First Served): Non-preemptive, processes execute in arrival order
  - **SJF** (Shortest Job First): Non-preemptive, shortest burst time runs first
  - **SRTF** (Shortest Remaining Time First): Preemptive SJF, switches to shorter remaining job
  - **Round Robin**: Time-quantum based preemptive scheduling, configurable quantum
  - **Priority (Non-preemptive)**: Lowest priority number runs first, non-preemptive
  - **Priority (Preemptive)**: Lowest priority number, preempts current process
- **Process Configuration**: Add processes with arrival time, burst time, priority
- **Visualization**: Gantt chart showing execution timeline
- **Metrics Calculated**: Waiting time, turnaround time, response time, CPU utilization
- **Comparison Charts**: Bar charts, scatter plots, radar charts comparing algorithms
- **Statistics**: Average waiting time, average turnaround time per algorithm

⚙️ **SETTINGS** (path: /settings, shortcut: S)
- **Theme Toggle**: Dark mode / Light mode with localStorage persistence
- **Alert Configuration**: Customize threshold alerts for CPU, memory, battery
- System preferences and configuration options

🤖 **AI ASSISTANT** (path: /ai-assistant, shortcut: A)
- This chatbot – answers OS concepts and PowerPulse questions
- Uses Gemini 2.5 Flash model
- Has access to live system metrics for personalized answers
- Maintains conversation history within session

═══════════════════════════════════════════
KEYBOARD SHORTCUTS
═══════════════════════════════════════════
D=Dashboard, I=Insights, P=Processes, R=Resources, H=History, E=Reports, K=Kernel Lab, B=Benchmarks, T=Thermal, X=CPU Scheduler, A=AI Assistant, S=Settings, Esc=Close modals

═══════════════════════════════════════════
API ENDPOINTS
═══════════════════════════════════════════
- WebSocket: ws://127.0.0.1:8000/ws/metrics (real-time data every 1s)
- GET /api/history?hours=N (historical metrics)
- POST /api/process/{pid}/kill, /force-kill, /kill-tree, /force-kill-tree
- POST /api/process/{pid}/suspend, /resume
- POST /api/process/{pid}/affinity (body: {cores: [0,1,2]})
- POST /api/process/{pid}/priority (body: {priority: "normal"})
- GET /api/process/{pid}/details
- GET /api/process/tree
- POST /api/chat (this AI endpoint)

═══════════════════════════════════════════
OS CONCEPTS (be thorough when explaining)
═══════════════════════════════════════════
Cover these OS topics in depth when asked:
- Processes & Threads: creation, states (new, ready, running, waiting, terminated), PCB, context switching, IPC (pipes, shared memory, message queues, semaphores, signals)
- CPU Scheduling: FCFS, SJF, SRTF, Round Robin, Priority, Multilevel Queue, Multilevel Feedback Queue, CPU burst, I/O burst, Gantt charts, convoy effect, starvation, aging
- Memory Management: paging, segmentation, virtual memory, page tables, TLB, page replacement (FIFO, LRU, Optimal, Clock), thrashing, working set, demand paging, page faults
- File Systems: FAT, NTFS, ext4, inodes, directories, file allocation (contiguous, linked, indexed)
- Disk Scheduling: FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK
- Deadlocks: conditions (mutual exclusion, hold & wait, no preemption, circular wait), prevention, avoidance (Banker's algorithm), detection, recovery
- Synchronization: mutex, semaphore, monitors, readers-writers, dining philosophers, producer-consumer
- Power Management: ACPI states (S0-S5), CPU frequency scaling (DVFS), thermal throttling, power-aware scheduling, battery management

RULES:
1. If the user asks something outside of Operating Systems or this application, politely decline and redirect them to OS topics.
2. When live system data is provided below, use it to give specific, personalized answers (e.g. "Your CPU is at 45%").
3. Format responses in Markdown: use **bold**, bullet lists, and code blocks where appropriate.
4. Be concise but thorough. Relate answers to real-world system behavior and how PowerPulse demonstrates these concepts.
5. If asked "what can you do?", list all the features and topics you can help with.
6. When explaining how to use a PowerPulse feature, include the page name, keyboard shortcut, and step-by-step instructions.
7. When answering OS theory questions, connect them to what the user can observe in PowerPulse.
"""

GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
MAX_RETRIES = 3
RETRY_BASE_DELAY = 1.0  # seconds

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

            per_core_cpu = monitor.get_per_core_usage()
            suggestions = monitor.get_suggestions()
            sys_info = monitor.get_sys_info()
            disk_parts = monitor.get_disk_partitions()

            # Build per-core thermal data
            sensor_lines = ""
            for s in thermal.get("sensors", []):
                sensor_lines += f"  - {s['label']}: {s['current']:.1f}°C (high: {s.get('high', 'N/A')}, critical: {s.get('critical', 'N/A')})\n"

            # Build per-core CPU data
            core_lines = ", ".join(f"Core {i}: {u:.1f}%" for i, u in enumerate(per_core_cpu))

            # Build disk partition data
            disk_lines = ""
            for d in disk_parts:
                disk_lines += f"  - {d.get('device', '?')} ({d.get('mountpoint', '?')}): {d.get('percent', 0):.0f}% used ({d.get('used', 0) / (1024**3):.1f} GB / {d.get('total', 0) / (1024**3):.1f} GB, {d.get('fstype', '?')})\n"

            # Build suggestions
            suggestion_lines = ""
            for s in suggestions:
                suggestion_lines += f"  - [{s.get('severity', 'info')}] {s.get('title', '')}: {s.get('message', '')}\n"

            live_context = f"""
LIVE SYSTEM DATA (current snapshot):
- CPU Usage: {cpu.usage_percent:.1f}% across {cpu.core_count} cores (Freq: {cpu.frequency_current:.0f} MHz)
- Per-Core CPU: {core_lines}
- Memory: {mem_info.get('percent', 0):.1f}% used ({mem_info.get('used', 0) / (1024**3):.1f} GB / {mem_info.get('total', 0) / (1024**3):.1f} GB)
  - Available: {mem_info.get('available', 0) / (1024**3):.1f} GB, Cached: {mem_info.get('cached', 0) / (1024**3):.1f} GB, Buffers: {mem_info.get('buffers', 0) / (1024**3):.2f} GB
- Swap: {swap.get('percent', 0):.1f}% used ({swap.get('used', 0) / (1024**3):.1f} GB / {swap.get('total', 0) / (1024**3):.1f} GB)
- Battery: {battery.percent:.0f}% {'(Charging)' if battery.power_plugged else '(On Battery)'}
- Thermal Overview: Max {thermal.get('max_temp', 0):.0f}°C, Avg {thermal.get('avg_temp', 0):.0f}°C, Throttling: {thermal.get('is_throttling', False)}
- Per-Sensor Temperatures:
{sensor_lines}- Health Score: {score}/100
- Top Processes by CPU: {', '.join(f"{p.name} ({p.cpu_percent:.1f}%)" for p in top_procs)}
- System: {sys_info.os_info}, Kernel: {sys_info.kernel_version}, RAM: {sys_info.ram_total_gb:.1f} GB
- Disk Partitions:
{disk_lines}- System Suggestions:
{suggestion_lines}"""
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
        gen_config = {
            "system_instruction": SYSTEM_PROMPT + live_context,
            "temperature": 0.7,
            "max_output_tokens": 2048,
        }

        # Try each model with retries (handles 503 / rate-limit errors)
        last_error = None
        for model_name in GEMINI_MODELS:
            for attempt in range(MAX_RETRIES):
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=gen_config,
                    )
                    reply = response.text if response.text else "I'm sorry, I couldn't generate a response. Please try again."
                    return {"success": True, "reply": reply}
                except Exception as e:
                    last_error = e
                    err_str = str(e).lower()
                    # Check for permission / auth errors first – not retryable, key is dead
                    is_permission_error = any(kw in err_str for kw in ["403", "permission_denied", "denied access", "forbidden"])
                    if is_permission_error:
                        print(f"[AI] API key rejected (403 PERMISSION_DENIED)")
                        return {
                            "success": False,
                            "reply": (
                                "🔑 **Your Gemini API key has been revoked or disabled.**\n\n"
                                "This usually happens when a key is exposed in a public repository "
                                "and Google automatically disables it for security.\n\n"
                                "**To fix this:**\n"
                                "1. Go to [Google AI Studio](https://aistudio.google.com/apikey)\n"
                                "2. Generate a **new** API key\n"
                                "3. Update `PowerPulse/.env` with the new key:\n"
                                "   ```\n"
                                "   GEMINI_API_KEY=your_new_key_here\n"
                                "   ```\n"
                                "4. **Restart the backend server**"
                            ),
                        }
                    is_retryable = any(kw in err_str for kw in ["503", "unavailable", "overloaded", "rate", "resource_exhausted", "429", "quota"])
                    if is_retryable and attempt < MAX_RETRIES - 1:
                        delay = RETRY_BASE_DELAY * (2 ** attempt)
                        print(f"[AI] {model_name} attempt {attempt+1} failed ({e}), retrying in {delay}s...")
                        await asyncio.sleep(delay)
                    elif is_retryable:
                        print(f"[AI] {model_name} exhausted {MAX_RETRIES} retries, trying next model...")
                        break  # move to next model
                    else:
                        raise  # non-retryable error, bubble up immediately

        # All models exhausted
        print(f"[AI] All models failed. Last error: {last_error}")
        return {
            "success": False,
            "reply": "⚠️ The AI service is currently experiencing very high demand across all models. Please wait a moment and try again."
        }

    except Exception as e:
        print(f"Chat error: {e}")
        return {"success": False, "reply": f"An error occurred: {str(e)}"}

@app.get("/")
def read_root():
    return {"message": "PowerPulse API is running. Connect to /ws/metrics for live data."}
