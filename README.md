<div align="center">

# ⚡ PowerPulse — OS Power Consumption Analyzer

### A Real-Time Operating System Power Consumption Analysis, Monitoring & Education Platform

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Gemini AI](https://img.shields.io/badge/Gemini_2.5_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real_Time-010101?style=for-the-badge&logo=socket.io&logoColor=white)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Monitor • Analyze • Optimize • Simulate • Learn**

---

*PowerPulse bridges the gap between Operating System theory and real-world system behavior by providing live monitoring, interactive CPU scheduling simulations, kernel-level process experiments, AI-powered insights, and publication-quality system reports — all wrapped in a stunning glassmorphic dashboard with dark and light theme support.*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Highlights](#-key-highlights)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Pages & Modules (Detailed)](#-pages--modules-detailed)
  - [Dashboard](#-dashboard----shortcut-d)
  - [Insights](#️-insights--insights--shortcut-i)
  - [Processes](#-processes--processes--shortcut-p)
  - [Resources](#️-resources--resources--shortcut-r)
  - [History](#-history--history--shortcut-h)
  - [Reports](#-reports--reports--shortcut-e)
  - [Kernel Lab](#-kernel-lab--kernel-lab--shortcut-k)
  - [Benchmarks](#-benchmarks--benchmarks--shortcut-b)
  - [Thermal Monitor](#️-thermal-monitor--thermal--shortcut-t)
  - [CPU Scheduler Simulator](#-cpu-scheduler-simulator--scheduler--shortcut-x)
  - [AI Assistant](#-ai-assistant--ai-assistant--shortcut-a)
  - [Settings](#️-settings--settings--shortcut-s)
- [Backend API Reference](#-backend-api-reference)
- [Data Models](#-data-models)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Design & UI/UX](#-design--uiux)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**PowerPulse** is a comprehensive, real-time Operating System Power Consumption Analyzer designed for students, developers, system administrators, and anyone who wants to understand how their operating system manages hardware resources. It uniquely combines:

1. **Live System Monitoring** — CPU, memory, disk, network, battery, thermal, and per-process data streamed via WebSocket every 1 second
2. **Advanced Process Management** — Kill, force kill, kill process trees, suspend, resume, set CPU affinity, and change scheduling priority — all from the browser
3. **Historical Trend Analysis** — Metrics logged every 60 seconds to a SQLite database with configurable time-range area charts (1h, 6h, 24h, 7d)
4. **Interactive OS Simulations** — CPU scheduler simulator with 6 algorithms, animated Gantt charts, and side-by-side comparison metrics
5. **Kernel Lab** — Hands-on experiments: select a live process, toggle individual CPU core affinity, change scheduling priority, inspect threads/handles/context switches via pie charts
6. **System Benchmarks** — 5-category performance benchmark suite (CPU, memory, compute, rendering, multi-task) with a tier ranking system (Iron → Diamond)
7. **AI-Powered Assistant** — Google Gemini 2.5 Flash chatbot with full access to live system metrics, per-core temperatures, disk partitions, and system suggestions as context
8. **Publication-Quality Reports** — Printable PDF system reports with GPU info, energy settings, benchmark history, and power profiles using `react-to-print`
9. **Thermal Intelligence** — Per-core temperature monitoring, throttle detection, and cross-platform support (Linux sensors, Windows WMI, CPU-load-based simulation)

The entire application is built with a **modern glassmorphic UI** featuring smooth Framer Motion animations, a responsive layout, and full dark/light theme support.

---

## 🚀 Key Highlights

| Category | Details |
|----------|---------|
| **Real-Time Data** | WebSocket streaming @ 1 update/sec with automatic reconnection |
| **12 Feature Pages** | Dashboard, Insights, Processes, Resources, History, Reports, Kernel Lab, Benchmarks, Thermal, Scheduler, AI Assistant, Settings |
| **Process Control** | 8 actions: kill, force kill, kill tree, force kill tree, suspend, resume, set affinity, set priority |
| **6 Scheduling Algorithms** | FCFS, SJF, SRTF, Round Robin, Priority (non-preemptive), Priority (preemptive) |
| **5 Benchmark Tests** | CPU (prime computation), Memory (allocation), Compute (math-heavy), Rendering (canvas), Multi-task (concurrent) |
| **7 Tier Rankings** | Iron, Bronze, Silver, Gold, Platinum, Emerald, Diamond |
| **AI Context** | Per-core CPU, per-sensor temps, memory breakdown, swap, battery, disk partitions, health score, top processes, suggestions |
| **Alert System** | Configurable CPU (50–99%), memory (50–99%), battery (5–50%) thresholds with desktop notifications and sound |
| **Themes** | Dark mode (default) + Light mode with localStorage persistence |
| **Charts** | Recharts area charts, bar charts, pie charts, radar charts, line charts with gradient fills |

---

## 🛠️ Technology Stack

### Languages

| Language | Usage |
|----------|-------|
| **Python 3.8+** | Backend API, system monitoring, database operations, AI integration |
| **JavaScript (ES6+)** | Frontend React application, benchmark algorithms, chart rendering |
| **HTML5** | Semantic page structure, SEO tags |
| **CSS3** | Custom styles, animations, theme system, glassmorphism effects |
| **SQL** | SQLite queries for historical metric storage and retrieval |

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **FastAPI** | Latest | High-performance async web framework with automatic OpenAPI docs |
| **Uvicorn** | Latest | ASGI server running the FastAPI application |
| **psutil** | Latest | Cross-platform system monitoring (CPU, memory, disk, network, battery, processes, temperatures) |
| **websockets** | Latest | WebSocket protocol support for real-time bidirectional data streaming |
| **google-genai** | Latest | Google Gemini API client for AI chatbot (Gemini 2.5 Flash model) |
| **python-dotenv** | Latest | `.env` file loading for API key management |
| **rich** | Latest | Enhanced terminal output formatting for development |

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **React** | 18.2 | Component-based UI framework with hooks and context API |
| **Vite** | 5.0 | Next-generation build tool with instant HMR (Hot Module Replacement) |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework for rapid UI development |
| **Recharts** | 3.7 | Composable charting library (AreaChart, BarChart, PieChart, RadarChart, ScatterChart) |
| **Framer Motion** | 12.29 | Production-ready animation library for React (page transitions, hover effects, stagger animations) |
| **React Router DOM** | 7.13 | Client-side routing with nested layouts and programmatic navigation |
| **Lucide React** | 0.563 | 1000+ beautiful SVG icons (Activity, Cpu, Battery, Zap, Brain, Flame, etc.) |
| **React-to-Print** | 3.2 | PDF/print generation for system reports with custom document titles |

### Development Dependencies

| Package | Purpose |
|---------|---------|
| **@vitejs/plugin-react** | React Fast Refresh for Vite |
| **ESLint** | JavaScript linting with react-hooks and react-refresh plugins |
| **PostCSS** | CSS processing pipeline for Tailwind |
| **Autoprefixer** | Automatic CSS vendor prefixing |

---

## 🏛️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Frontend (React 18 + Vite 5)                  │
│                                                                    │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ Dashboard   │ │ Insights   │ │ Processes    │ │ Resources   │ │
│  │ (4 stats +  │ │ (health    │ │ (table +     │ │ (per-core   │ │
│  │  3 charts + │ │  gauge +   │ │  8 actions + │ │  bars +     │ │
│  │  power hogs)│ │  advisor)  │ │  tree view)  │ │  charts)    │ │
│  └──────┬──────┘ └──────┬─────┘ └──────┬───────┘ └──────┬──────┘ │
│  ┌──────┴──────┐ ┌──────┴─────┐ ┌──────┴───────┐ ┌──────┴──────┐ │
│  │ History     │ │ Reports    │ │ Kernel Lab   │ │ Benchmarks  │ │
│  │ (4 area     │ │ (PDF +     │ │ (affinity +  │ │ (5 tests +  │ │
│  │  charts +   │ │  GPU info +│ │  priority +  │ │  tiers +    │ │
│  │  4 ranges)  │ │  energy)   │ │  pie chart)  │ │  export)    │ │
│  └──────┬──────┘ └──────┬─────┘ └──────┬───────┘ └──────┬──────┘ │
│  ┌──────┴──────┐ ┌──────┴─────┐ ┌──────┴───────────────┐        │
│  │ Thermal     │ │ Scheduler  │ │ AI Assistant          │        │
│  │ (per-core   │ │ (6 algos + │ │ (Gemini 2.5 Flash +   │        │
│  │  temps +    │ │  Gantt +   │ │  live metrics context) │        │
│  │  throttle)  │ │  compare)  │ │                       │        │
│  └──────┬──────┘ └──────┬─────┘ └───────────┬───────────┘        │
│         └───────────────┼───────────────────┘                    │
│                    HTTP / WebSocket / REST                        │
└────────────────────────┼─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI + Python)                      │
│                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │     api.py        │  │   monitor.py      │  │  database.py    │ │
│  │  ─────────────── │  │  ─────────────── │  │  ────────────── │ │
│  │  REST endpoints  │  │  SystemMonitor    │  │  SQLite ORM     │ │
│  │  WebSocket /ws   │  │  class wrapping   │  │  metrics.db     │ │
│  │  CORS middleware │  │  psutil calls     │  │  60s intervals  │ │
│  │  AI chat POST    │  │  Thermal info     │  │  History query  │ │
│  │  Process mgmt    │  │  Process tree     │  │                 │ │
│  │  Gemini client   │  │  Score algorithm  │  │                 │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘ │
│           │                     │                      │          │
│           ▼                     ▼                      ▼          │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                 Operating System Kernel (via psutil)        │   │
│  │  CPU │ Memory │ Disk │ Network │ Battery │ Thermal │ Procs │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow Pipeline

1. **psutil** reads hardware counters directly from the OS kernel (cross-platform: Windows, Linux, macOS)
2. **SystemMonitor** class wraps raw psutil data into structured Python dataclasses: `BatteryInfo`, `CpuInfo`, `ProcessInfo`, `DiskIO`, `NetIO`, `SysInfo`
3. **FastAPI WebSocket** (`/ws/metrics`) broadcasts a complete system snapshot to all connected clients every 1 second
4. **SQLite database** (`metrics.db`) stores a snapshot every 60 seconds for historical trend analysis
5. **React frontend** consumes WebSocket data via `MetricsContext` (React Context API), rendering live charts, gauges, and tables with Framer Motion animations
6. **AI Assistant** injects the full live metrics snapshot (per-core CPU, per-sensor temps, memory breakdown, disk partitions, process list, suggestions) into Gemini 2.5 Flash's system prompt for context-aware, personalized answers

---

## 📑 Pages & Modules (Detailed)

### 📊 Dashboard (`/` — Shortcut: `D`)

The command center of PowerPulse. A real-time system overview updated every second via WebSocket.

**Stat Cards (4 animated cards with progress bars):**

| Card | Value | Subtitle | Color | Progress Bar |
|------|-------|----------|-------|-------------|
| Battery Level | `XX.X%` | Time remaining or charging status | Green | ✅ (battery %) |
| Power Draw | `X.XX W` or "On AC" | "Plugged In" or "Discharging" | Yellow | ❌ |
| CPU Utilization | `XX%` | Current frequency in MHz | Blue | ✅ (CPU %) |
| System Health | `XX/100` | "Stability Score" | Purple | ✅ (score %) |

Each card features:
- Framer Motion entrance animation with staggered delays (0.1s per card)
- Hover effect: lifts up 4px and scales to 1.02x
- Gradient progress bar with smooth animated width transition
- Subtle background glow effect on hover
- Color-coded icon container with 10% opacity background

**Live Charts (3 area charts with gradient fills):**

| Chart | Data Keys | Colors | Size |
|-------|-----------|--------|------|
| CPU Usage Trend | `usage` | Cyan (#06b6d4) gradient fill | Half width |
| Network Activity (KB/s) | `recv_rate` (Download), `sent_rate` (Upload) | Purple (#a855f7) + Pink (#f472b6) | Half width |
| Disk Activity (KB/s) | `read_rate` (Read), `write_rate` (Write) | Yellow (#eab308) + Orange (#f97316) | 2/3 width |

**Top Power Hogs Panel:**
- Shows top 5 processes sorted by `power_score` (a composite of CPU% + memory%)
- Truncated process names with hover tooltip
- Red mono-spaced font for power scores
- "View All Processes →" link to the Processes page

**Connection Status:**
- Shows "Waiting for connection..." with an Unplug icon when WebSocket is disconnected
- Shows a dynamic one-line summary when connected:
  - Green pulse dot if health ≥ 80 ("System running smoothly.")
  - Yellow pulse dot if health ≥ 50 (shows first suggestion message)
  - Red pulse dot if health < 50

---

### 🛡️ Insights (`/insights` — Shortcut: `I`)

An intelligent system health advisory panel that analyzes metrics and provides actionable recommendations.

**System Health Score Gauge:**
- Animated SVG circular gauge (0–100) with smooth transitions
- Color coding: 🟢 Green (≥80), 🟡 Yellow (≥50), 🔴 Red (<50)
- Health score algorithm starts at 100 and deducts:
  - CPU > 80%: **−15 points**
  - Memory > 85%: **−20 points**
  - Disk partition > 90%: **−15 points**
  - Battery < 20%: **−10 points**
  - Swap > 50%: **−10 points**

**Smart Advisor Panel:**
- Auto-generated suggestions with severity levels:
  - 🔴 **Critical**: "⚠ CPU Overload" (CPU > 90%)
  - 🟡 **Warning**: "Memory running high" (memory > 85%), "Disk partition nearly full" (disk > 90%), "Low battery" (battery < 20%)
  - 🔵 **Info**: Educational tips
  - 🟢 **Success**: "System running optimally" (all metrics healthy)

**Additional Cards:**
- **Health Trend Sparkline**: Mini SVG line chart showing recent health score values
- **Battery Card**: Charging/discharging indicator, time remaining, low battery warning
- **Load vs Cores**: 1-minute load average compared to CPU core count; warns if >1.0 per core
- **"Did You Know?"**: Rotating carousel of educational OS tips
- **Top Resource Hogs**: Top 5 by CPU% and top 5 by memory% in separate lists
- **Memory Breakdown**: Used, Available, Cached, Buffers — each in its own card with formatted sizes (auto-scales KB/MB/GB)
- **Swap Usage**: Total/Used/Free/Percent with visual warning if >50%
- **Disk Partitions Table**: Device, mount point, filesystem type, total/used/free/percent with color-coded alerts (≥90% red, ≥80% yellow)
- **System Info Cards**: OS info, kernel version, boot time (formatted), load average (1/5/15 min)

---

### ⚡ Processes (`/processes` — Shortcut: `P`)

A full-featured process manager with 695 lines of functionality.

**Process Table:**
- Displays up to 50 processes with columns: PID, Name, CPU%, Memory%, Threads, Handles, Nice Level, Status
- Real-time search/filter by process name
- Click any column header to sort (ascending/descending with arrow indicators)
- Status badges: 🟢 running, 🔵 sleeping, 🟡 stopped, 🔴 zombie, ⚪ idle, 🟠 disk_sleep

**8 Process Actions (per-process):**

| Action | API Endpoint | Method | Behavior |
|--------|-------------|--------|----------|
| Kill (Graceful) | `/api/process/{pid}/kill` | POST | SIGTERM — process can save data |
| Force Kill | `/api/process/{pid}/force-kill` | POST | SIGKILL — immediate, no save |
| Kill Tree | `/api/process/{pid}/kill-tree` | POST | Terminates process + all children |
| Force Kill Tree | `/api/process/{pid}/force-kill-tree` | POST | Aggressive kill via `taskkill /F /T` (Windows) |
| Suspend | `/api/process/{pid}/suspend` | POST | Pauses process execution |
| Resume | `/api/process/{pid}/resume` | POST | Resumes a suspended process |
| Set CPU Affinity | `/api/process/{pid}/affinity` | POST | Body: `{"cores": [0,1,2]}` |
| Set Priority | `/api/process/{pid}/priority` | POST | Body: `{"priority": "normal"}` |

**Priority Levels with Color Badges:**
- `idle` → Slate badge
- `below_normal` → Cyan badge
- `normal` → Green badge
- `above_normal` → Yellow badge
- `high` → Orange badge
- `realtime` → Rose badge (⚠ Dangerous)

**Process Details Panel:**
- PID, name, status, CPU%, memory%, threads, handles, nice level
- CPU affinity (which cores are assigned)
- I/O counters: read bytes, write bytes, read count, write count

**Process Tree View:**
- Hierarchical parent-child visualization
- Indented rows showing process relationships
- Fetched via `GET /api/process/tree`

**Retry Logic:**
- `fetchWithTimeout()` with 15-second timeout and AbortController
- `retryFetch()` with exponential backoff and up to 2 retries
- Backend offline detection with cooldown alerts

---

### 🖥️ Resources (`/resources` — Shortcut: `R`)

Detailed resource utilization breakdowns with live-updating visualizations.

- **CPU Section**: Per-core usage bars (individual bar per logical core), overall CPU%, current frequency (MHz), core count
- **Memory Section**: Visual progress bar with used/total/available and percentage
- **Network Section**: Real-time sent/received rate area charts with gradient fills and historical data buffer
- **Disk Section**: Read/write rate area charts with gradient fills and historical data buffer
- All charts auto-update every second via WebSocket `MetricsContext`

---

### 📈 History (`/history` — Shortcut: `H`)

Long-term historical metric analysis with configurable time ranges.

**Time Range Presets:**

| Button | Range | Label |
|--------|-------|-------|
| 1h | Last 1 hour | `1h` |
| 6h | Last 6 hours | `6h` |
| 24h | Last 24 hours | `24h` |
| 7d | Last 7 days | `7d` |

**4 Chart Sections (each 300px tall):**

| Chart | Data Keys | Colors |
|-------|-----------|--------|
| CPU Utilization | `cpu` | Cyan (#22d3ee) |
| Memory Usage | `memory` | Purple (#a855f7) |
| Network Traffic (Bytes/sec) | `net_recv_rate` + `net_sent_rate` | Green (#34d399) + Blue (#3b82f6) |
| Disk I/O (Bytes/sec) | `disk_read_rate` + `disk_write_rate` | Amber (#f59e0b) + Rose (#f43f5e) |

**Features:**
- Each chart uses Recharts `AreaChart` with gradient fills, CartesianGrid, X/Y axes, tooltips, and legends
- Timestamps formatted as `HH:MM` using `toLocaleTimeString()`
- Loading spinner with ping animation while fetching
- Empty state: Database icon with "No historical data yet. Data is collected every 60 seconds."

---

### 📄 Reports (`/reports` — Shortcut: `E`)

Generate professional, printable system health reports.

**Report Features:**
- Uses `react-to-print` for native browser print dialog with PDF export
- Document title format: `OS_Power_Consumption_Analyzer_Report_YYYY-MM-DD`
- **ReportDocument** component renders a structured report with:
  - System info header (OS, CPU model, RAM, kernel)
  - CPU statistics and per-core data
  - Memory breakdown (used, available, cached, buffers)
  - Disk partition details
  - Top processes by power score
  - Health score and suggestions
- **GPU Detection**: Uses WebGL API (`WEBGL_debug_renderer_info`) to detect GPU vendor, renderer, and version
- **Energy Settings**: Region-based electricity rate, currency, CO₂ factor, system type (laptop/desktop), daily budget
- **Benchmark History**: Loads from `powerpulse_benchmark_history` in localStorage
- **Power Profiles**: Loads active profile and saved profiles from localStorage
- Print preview with 80% scale transform

---

### 🧪 Kernel Lab (`/kernel-lab` — Shortcut: `K`)

A hands-on operating system laboratory for experimenting with real, live processes.

**Left Panel — Process Selector:**
- Scrollable list of all running processes with PID, name, status, CPU%
- System CPU cores bar chart (Recharts BarChart) showing per-core usage
- Click any process to select it for inspection

**Right Panel — Process Inspector:**

| Section | Details |
|---------|---------|
| **Header** | Process name (large), PID, core count assignment |
| **CPU Affinity** | Interactive grid of core buttons (C0, C1, C2, ... C15). Click to toggle individual cores on/off. "RESET ALL" button restores all cores. Prevents detaching from ALL cores (minimum 1). Optimistic UI with rollback on failure. |
| **Scheduling Priority** | Dropdown selector: Idle (Lowest), Below Normal, Normal, Above Normal, High, Realtime (Dangerous). Optimistic update with rollback. |
| **Threads vs Handles** | Donut pie chart (Recharts PieChart) showing threads (cyan) vs handles (purple). "Restricted" badge if values are 0 (system processes). Error state for connection failures. |
| **Detailed Stats** | Grid of stat boxes: Threads, Handles, Context Switches (formatted with locale separators), User, Create Time |

**Actions:**
- Suspend button (orange, Pause icon)
- Resume button (green, Play icon)
- Action messages with auto-dismiss (success: green, error: red, access denied: amber with "Run as Admin" hint)

---

### 📊 Benchmarks (`/benchmarks` — Shortcut: `B`)

A comprehensive 5-category system performance benchmark suite with tier rankings.

**5 Benchmark Tests:**

| Test | Icon | Duration | Algorithm |
|------|------|----------|-----------|
| **CPU Performance** | Cpu | 5 seconds | Prime number calculation stress test (`isPrime()` up to large numbers) |
| **Memory** | Monitor | 5 seconds | Array allocation, fill, and access speed tests |
| **Compute** | Zap | 5 seconds | Math-heavy operations (trigonometry, logarithms, square roots) |
| **Rendering** | Layers | 4 seconds | Canvas-based 2D rendering (shapes, gradients, transforms) |
| **Multi-Task** | Layers | 4 seconds | Concurrent promise resolution with parallel operations |

**Tier Ranking System (7 Tiers):**

| Tier | Min Score | Color | Icon |
|------|-----------|-------|------|
| Iron | 0 | Slate | Minus |
| Bronze | 30 | Amber | Medal |
| Silver | 50 | Slate-300 | Award |
| Gold | 70 | Yellow | Crown |
| Platinum | 85 | Cyan | Target |
| Emerald | 95 | Emerald | Sparkles |
| Diamond | 98 | Fuchsia | Gem |

**Features:**
- **Countdown Animation**: 3-2-1 countdown before benchmark starts
- **Progress Tracking**: Circular SVG progress indicator per test with percentage
- **Run All**: Sequentially runs all 5 benchmarks
- **Run Individual**: Run any single benchmark
- **Stop**: Cancel mid-benchmark
- **Score Ratings**: "Excellent" (≥90), "Great" (≥75), "Good" (≥50), "Fair" (≥25), "Poor" (<25)
- **Performance Tips**: Context-aware tips based on individual test scores (e.g., "Close apps to free CPU", "Your GPU handles rendering well")
- **History**: Past results stored in localStorage with comparison arrows (↑ improved, ↓ declined, — same)
- **Export Results**: Download benchmark results as JSON file
- **Clear History**: Reset all stored benchmark data

---

### 🌡️ Thermal Monitor (`/thermal` — Shortcut: `T`)

Real-time CPU and system temperature monitoring with throttle detection.

**Data Collected Per Sensor:**
- Chip name (e.g., "CPU", "coretemp", "WMI")
- Label (e.g., "Core 0", "Core 1", "Package")
- Current temperature (°C)
- High threshold temperature
- Critical threshold temperature

**Metrics:**
- **Max Temperature**: Highest reading across all sensors
- **Average Temperature**: Mean of all sensor readings
- **Throttling Detection**: Triggered when any sensor reaches its critical threshold

**Temperature History:** Chart tracking temperature values over time

**Cross-Platform Support:**

| Platform | Method |
|----------|--------|
| Linux | `psutil.sensors_temperatures()` reading `/sys/class/thermal` |
| macOS | `psutil.sensors_temperatures()` |
| Windows (primary) | Simulated based on per-core CPU load: `base_temp (38-45°C) + (core_usage × 0.55)` |
| Windows (fallback) | WMI via `OpenHardwareMonitor` or `MSAcpi_ThermalZoneTemperature` (disabled for stability) |

---

### 📅 CPU Scheduler Simulator (`/scheduler` — Shortcut: `X`)

An interactive, educational CPU scheduling algorithm simulator with 839 lines of implementation.

**6 Scheduling Algorithms:**

| Algorithm | Type | Time Complexity | Description |
|-----------|------|-----------------|-------------|
| **FCFS** | Non-preemptive | O(n) | First Come First Served. Processes execute strictly in arrival order. Simple but suffers from the **convoy effect**. |
| **SJF** | Non-preemptive | O(n²) | Shortest Job First. Selects process with shortest burst time. Optimal for minimizing average waiting time but may cause **starvation** of long processes. |
| **SRTF** | Preemptive | O(n²) | Shortest Remaining Time First. Preemptive variant of SJF. Switches to a newly arrived process if its remaining time is shorter. Best average waiting time. |
| **Round Robin** | Preemptive | O(n) | Time-quantum scheduling. Each process gets a fixed time slice (configurable quantum, default 2). Fair but sensitive to quantum size. |
| **Priority (Non-preemptive)** | Non-preemptive | O(n²) | Lowest priority number runs first. Once started, runs to completion. Can cause starvation; solved with **aging**. |
| **Priority (Preemptive)** | Preemptive | O(n²) | Preemptive priority. Switches immediately to higher-priority process on arrival. |

**Process Configuration:**
- Add processes with: Name (P1, P2, ...), Arrival Time, Burst Time, Priority
- Default processes: P1(0,6,2), P2(1,4,1), P3(2,8,3), P4(3,3,4)
- Add and remove processes dynamically
- Update individual fields in real-time

**Visualization:**
- **Animated Gantt Chart**: Color-coded execution timeline with process labels and time markers
- **Step-by-step Animation**: Watch the scheduler execute in real-time with play/pause controls
- **Speed Control**: Adjust animation speed

**Comparison Mode:**
- **Bar Charts**: Side-by-side average waiting time and turnaround time per algorithm
- **Scatter Plots**: Process-level waiting time distribution
- **Radar Charts**: Multi-dimensional algorithm comparison
- **Statistics Table**: Avg waiting time, avg turnaround time, avg response time, CPU utilization per algorithm

---

### 🤖 AI Assistant (`/ai-assistant` — Shortcut: `A`)

An intelligent chatbot powered by **Google Gemini 2.5 Flash** with deep knowledge of OS concepts and PowerPulse features.

**System Prompt Knowledge Base (~160 lines):**
- Complete descriptions of all 12 pages with paths and keyboard shortcuts
- All API endpoints with methods and request bodies
- 8 OS concept categories: processes, scheduling, memory, file systems, disk scheduling, deadlocks, synchronization, power management
- Rules for connecting OS theory to observable PowerPulse behavior

**Live Context Injected Per Request:**

| Data Point | Example |
|-----------|---------|
| CPU Usage | `12.5% across 8 cores (Freq: 2400 MHz)` |
| Per-Core CPU | `Core 0: 8.2%, Core 1: 15.3%, Core 2: 3.1%, ...` |
| Memory | `62.3% used (9.8 GB / 15.7 GB)` |
| Memory Breakdown | `Available: 5.9 GB, Cached: 3.2 GB, Buffers: 0.15 GB` |
| Swap | `12.0% used (0.5 GB / 4.0 GB)` |
| Battery | `78% (Charging)` |
| Thermal Overview | `Max 58°C, Avg 52°C, Throttling: False` |
| Per-Sensor Temps | `Core 0: 55.2°C, Core 1: 57.8°C, Core 2: 51.3°C, ...` |
| Health Score | `85/100` |
| Top Processes | `chrome (12.5%), vscode (8.3%), python (5.1%), ...` |
| System Info | `Windows 11, Kernel: 10.0.22621, RAM: 16.0 GB` |
| Disk Partitions | `C:\ (C:\): 68% used (130.5 GB / 237.9 GB, NTFS)` |
| System Suggestions | `[info] System Healthy: All metrics within normal range` |

**Chat Features:**
- Markdown rendering: **bold**, bullet lists, `code blocks`, headers
- Suggested starter questions (4 clickable buttons)
- Typing indicator with spinning animation
- Chat history maintained within session
- Clear Chat button
- Auto-scroll to latest message
- Polite refusal for off-topic questions

---

### ⚙️ Settings (`/settings` — Shortcut: `S`)

Application configuration and alert preferences.

**Appearance:**
- Dark/Light theme toggle with `localStorage` persistence (`powerpulse_theme`)
- Uses `data-theme` attribute on `<html>` element for CSS theming

**Notifications:**
- Desktop Notifications toggle (requests browser `Notification.permission`)
- Alert Sound toggle (plays beep when alerts fire)
- Both toggles use custom animated sliding switch UI

**Alert Threshold Sliders (3 configurable ranges):**

| Alert | Icon | Range | Default | Description |
|-------|------|-------|---------|-------------|
| CPU High Warning | Cpu (cyan) | 50–99% | 90% | Alert when processor exceeds threshold |
| Memory High Warning | AlertTriangle (purple) | 50–99% | 85% | Alert when RAM exceeds threshold |
| Battery Low Warning | Battery (red) | 5–50% | 20% | Alert when battery drops below threshold |

- Sliders disabled (opacity 50%) when notifications are off
- Save Configuration button with animated feedback (bounce animation on save icon)
- Settings persisted to `localStorage` as `powerpulse_settings`

---

## 📡 Backend API Reference

### WebSocket

| Endpoint | Description | Frequency |
|----------|-------------|-----------|
| `WS /ws/metrics` | Real-time system snapshot stream | Every 1 second |

**WebSocket Payload Structure:**
```json
{
  "battery": {"percent": 78.0, "status": "Charging", "power_plugged": true, "secsleft": -1, "power_watts": null},
  "cpu": {"usage_percent": 12.5, "frequency_current": 2400.0, "core_count": 8},
  "cpu_cores": [8.2, 15.3, 3.1, 22.5, 5.8, 10.2, 7.9, 11.4],
  "memory": {"total": 16841170944, "available": 6342189056, "percent": 62.3, "used": 10498981888, "cached": 3435814912, "buffers": 157286400},
  "swap": {"total": 4294967296, "used": 515899392, "free": 3779067904, "percent": 12.0},
  "disk_io": {"read_bytes": 1234567890, "write_bytes": 987654321, "read_count": 45678, "write_count": 23456},
  "network_io": {"bytes_sent": 56789012, "bytes_recv": 123456789, "packets_sent": 34567, "packets_recv": 67890},
  "processes": [...],
  "thermal": {"sensors": [...], "max_temp": 58.0, "avg_temp": 52.0, "is_throttling": false, "available": true},
  "health_score": 85,
  "suggestions": [...],
  "sys_info": {"os_info": "Windows 11", "cpu_model": "Intel i7-1165G7", "ram_total_gb": 15.7, "kernel_version": "10.0.22621"},
  "disk_partitions": [...]
}
```

### REST Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/history?hours=N` | — | Historical metrics for the last N hours |
| `POST` | `/api/process/{pid}/kill` | — | Gracefully terminate (SIGTERM) |
| `POST` | `/api/process/{pid}/force-kill` | — | Force kill (SIGKILL) |
| `POST` | `/api/process/{pid}/kill-tree` | — | Terminate process tree |
| `POST` | `/api/process/{pid}/force-kill-tree` | — | Force kill tree (taskkill /F /T) |
| `POST` | `/api/process/{pid}/suspend` | — | Suspend (freeze) process |
| `POST` | `/api/process/{pid}/resume` | — | Resume suspended process |
| `POST` | `/api/process/{pid}/affinity` | `{"cores": [0,1,2]}` | Set CPU core affinity |
| `POST` | `/api/process/{pid}/priority` | `{"priority": "normal"}` | Set scheduling priority |
| `GET` | `/api/process/{pid}/details` | — | Detailed process info |
| `GET` | `/api/process/tree` | — | Hierarchical process tree |
| `POST` | `/api/chat` | `{"message": "...", "history": [...]}` | AI chatbot conversation |

### Swagger/OpenAPI
```
http://127.0.0.1:8000/docs
```

---

## 📊 Data Models

### Python Dataclasses (monitor.py)

```python
@dataclass
class BatteryInfo:
    percent: float
    secsleft: Optional[int]
    power_plugged: bool
    status: str
    power_watts: Optional[float] = None

@dataclass
class CpuInfo:
    frequency_current: float
    usage_percent: float
    core_count: int

@dataclass
class ProcessInfo:
    pid: int
    name: str
    cpu_percent: float
    memory_percent: float
    io_counters: Any
    power_score: float
    num_threads: int = 0
    num_handles: int = 0
    nice_level: int = 0
    cpu_affinity: Optional[List[int]] = None
    status: str = "unknown"

@dataclass
class DiskIO:
    read_bytes: int
    write_bytes: int
    read_count: int
    write_count: int

@dataclass
class NetIO:
    bytes_sent: int
    bytes_recv: int
    packets_sent: int
    packets_recv: int

@dataclass
class SysInfo:
    os_info: str
    cpu_model: str
    ram_total_gb: float
    kernel_version: str = ""
    boot_time: float = 0.0
    load_avg: Optional[Tuple[float, float, float]] = None
```

---

## ⌨️ Keyboard Shortcuts

| Key | Page | Icon |
|-----|------|------|
| `D` | Dashboard | Activity |
| `I` | Insights | ShieldCheck |
| `P` | Processes | Zap |
| `R` | Resources | Cpu |
| `H` | History | History |
| `E` | Reports | FileText |
| `K` | Kernel Lab | Layers |
| `B` | Benchmarks | BarChart3 |
| `T` | Thermal Monitor | Thermometer |
| `X` | CPU Scheduler Simulator | Calendar |
| `A` | AI Assistant | Brain |
| `S` | Settings | Settings |
| `Esc` | Close modals/dialogs | — |

---

## 🎨 Design & UI/UX

### Glassmorphism Design System
- `.glass-panel` class: semi-transparent backgrounds with backdrop blur, subtle borders, and rounded corners
- Dark theme: `#0f172a` base (Slate 900) with glass panels at `rgba(15, 23, 42, 0.8)`
- Light theme: White base with `rgba(255, 255, 255, 0.8)` glass panels

### Animation System (Framer Motion)
- Page entrance animations: `opacity: 0 → 1`, `y: 20 → 0`
- Stat card hover: `y: -4`, `scale: 1.02`
- Staggered list animations with configurable delays
- `AnimatePresence` for enter/exit transitions
- Scroll-to-bottom on new chat messages

### Color Palette

| Element | Dark Mode | Light Mode |
|---------|-----------|------------|
| Background | `#0f172a` (Slate 900) | `#ffffff` |
| Text Primary | `#f8fafc` (Slate 50) | `#0f172a` |
| Text Secondary | `#94a3b8` (Slate 400) | `#64748b` |
| Accent Primary | `#06b6d4` (Cyan 500) | `#0ea5e9` |
| Accent Secondary | `#8b5cf6` (Purple 500) | `#7c3aed` |
| Success | `#22c55e` (Green 500) | `#16a34a` |
| Warning | `#eab308` (Yellow 500) | `#ca8a04` |
| Danger | `#ef4444` (Red 500) | `#dc2626` |

### Responsive Layout
- Sidebar navigation with collapsible width
- Grid layouts: 1 column (mobile) → 2 columns (tablet) → 4 columns (desktop)
- Charts resize with `ResponsiveContainer` (100% width)

---

## 📋 Prerequisites

| Requirement | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.8+ | Backend runtime |
| **Node.js** | 16.x+ | Frontend build tool and dev server |
| **npm** | 8.x+ | Package management |
| **Gemini API Key** | — | Required only for AI Assistant ([Get one free](https://aistudio.google.com/apikey)) |

---

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/vishrutcodes/Operating-System-Power-Consumption-Analyzer.git
cd "Operating Systems Power Consumption Analyzer"
```

### 2. Backend Setup

```bash
cd PowerPulse

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/macOS
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

**Dependencies installed:** `psutil`, `rich`, `fastapi`, `uvicorn`, `websockets`, `google-genai`, `python-dotenv`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

**Dependencies installed:** `react`, `react-dom`, `react-router-dom`, `recharts`, `framer-motion`, `lucide-react`, `react-to-print`, `tailwindcss`, `vite`

### 4. Configure Environment Variables

Create a `.env` file in the `PowerPulse/` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> 💡 **Get a free API key** from [Google AI Studio](https://aistudio.google.com/apikey). The AI Assistant will work without it, but will show a configuration error message.

---

## 🚀 Usage

### One-Click Start (Windows)

```bash
cd PowerPulse
run_app.bat
```

This script automatically:
1. Activates the Python virtual environment
2. Starts the FastAPI backend server on port 8000
3. Starts the Vite frontend dev server on port 5173

### Manual Start

**Terminal 1 — Backend:**

```bash
cd PowerPulse
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # Linux/macOS
cd src
uvicorn powerpulse.api:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — Frontend:**

```bash
cd PowerPulse/frontend
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| **Frontend Dashboard** | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | [http://127.0.0.1:8000](http://127.0.0.1:8000) |
| **API Documentation** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) |
| **WebSocket Stream** | `ws://127.0.0.1:8000/ws/metrics` |

---

## 📁 Project Structure

```
Operating Systems Power Consumption Analyzer/
│
├── README.md                              # This documentation file
│
└── PowerPulse/
    │
    ├── .env                               # Environment variables (GEMINI_API_KEY)
    ├── requirements.txt                   # Python dependencies (7 packages)
    ├── pyproject.toml                     # Python project metadata
    ├── run_app.bat                        # Windows one-click launcher script
    ├── metrics.db                         # SQLite database (auto-created, ~110 KB)
    │
    ├── src/
    │   └── powerpulse/                    # Python backend package
    │       ├── __init__.py                # Package initializer
    │       ├── api.py                     # FastAPI app (503 lines)
    │       │                              #   - REST endpoints (process management)
    │       │                              #   - WebSocket /ws/metrics (real-time streaming)
    │       │                              #   - AI chat POST endpoint
    │       │                              #   - CORS middleware, Pydantic models
    │       │                              #   - System prompt (~160 lines)
    │       ├── monitor.py                 # SystemMonitor class (871 lines)
    │       │                              #   - psutil wrapper with dataclasses
    │       │                              #   - Battery, CPU, memory, disk, network
    │       │                              #   - Process management (kill/suspend/resume)
    │       │                              #   - Affinity, priority, process tree
    │       │                              #   - Thermal monitoring (cross-platform)
    │       │                              #   - Health score algorithm
    │       │                              #   - Smart suggestions generator
    │       └── database.py                # SQLite operations
    │                                      #   - Metrics logging (every 60s)
    │                                      #   - History queries by time range
    │
    └── frontend/                          # React frontend application
        ├── package.json                   # npm dependencies (7 deps + 7 devDeps)
        ├── vite.config.js                 # Vite build configuration
        ├── tailwind.config.js             # Tailwind CSS configuration
        ├── postcss.config.js              # PostCSS pipeline
        ├── index.html                     # HTML entry point
        │
        └── src/
            ├── main.jsx                   # React DOM root render
            ├── App.jsx                    # Routing + MetricsContext + WebSocket
            ├── Layout.jsx                 # Sidebar navigation + keyboard shortcuts
            ├── config.js                  # API base URL configuration
            ├── index.css                  # Global styles (645 lines)
            │                              #   - Tailwind directives
            │                              #   - Glass panel design system
            │                              #   - Custom scrollbar styles
            │                              #   - Animation keyframes
            │                              #   - Light theme overrides
            │                              #   - AI message styling
            │
            ├── pages/
            │   ├── Dashboard.jsx          # Real-time overview (315 lines)
            │   ├── Insights.jsx           # Health score & advisor (395 lines)
            │   ├── Processes.jsx          # Process manager (695 lines)
            │   ├── Resources.jsx          # Resource utilization
            │   ├── History.jsx            # Historical charts (137 lines)
            │   ├── Reports.jsx            # PDF report generator (95 lines)
            │   ├── KernelLab.jsx          # OS experiments (457 lines)
            │   ├── Benchmarks.jsx         # Performance tests (1377 lines)
            │   ├── ThermalMonitor.jsx      # Temperature monitor (303 lines)
            │   ├── SchedulerSimulator.jsx # CPU scheduling sim (839 lines)
            │   ├── AIAssistant.jsx        # Gemini chatbot (291 lines)
            │   └── Settings.jsx           # Configuration (180 lines)
            │
            ├── components/
            │   └── ReportDocument.jsx     # Printable report layout
            │
            └── hooks/
                └── useAlerts.js           # Alert threshold monitoring hook
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | For AI | None | Google Gemini API key ([Get here](https://aistudio.google.com/apikey)) |

### localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `powerpulse_theme` | `"dark"` / `"light"` | Active theme preference |
| `powerpulse_settings` | JSON | Alert thresholds and notification preferences |
| `powerpulse_benchmark_history` | JSON array | Past benchmark results |
| `powerpulse_energy_region` | JSON | Energy cost region config |
| `powerpulse_system_type` | String | `"laptop"` or `"desktop"` |
| `powerpulse_daily_budget` | Float | Daily energy budget |
| `powerpulse_profiles` | JSON array | Power profile configurations |
| `powerpulse_active_profile` | String | Active power profile ID |

### Database

| File | Engine | Purpose |
|------|--------|---------|
| `metrics.db` | SQLite | Historical metrics storage, auto-created on first run, grows ~1.8 KB per minute |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes using [Conventional Commits](https://www.conventionalcommits.org/) (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style and React component patterns
- Use Tailwind CSS utility classes (avoid custom CSS unless necessary)
- Test with both dark and light themes
- Ensure responsive layout (mobile, tablet, desktop breakpoints)
- Add appropriate Lucide React icons for new UI elements
- Use Framer Motion for entry/exit animations

### Code Quality Tools

```bash
# Frontend linting
cd frontend
npm run lint

# Backend type checking
cd src
python -m mypy powerpulse/
```

---

## 🧪 Testing & Validation

PowerPulse includes a built-in benchmark and testing suite to validate system performance and stability.

### Manual Verification

1.  **System Monitoring:** Open the Dashboard (`/`) and verify that CPU, Memory, Disk, and Network metrics are updating every second.
2.  **Process Management:** Go to Processes (`/processes`) and try suspending and resuming a safe, non-critical process to verify control functionality.
3.  **Alerts:** In Settings (`/settings`), temporarily lower the CPU warning threshold. Run a CPU-intensive task or benchmark to ensure desktop notifications and alert sounds trigger correctly.

### Running Benchmarks

Navigate to the Benchmarks page (`/benchmarks`):
1.  Click **"Run All Benchmarks"**.
2.  Verify that all 5 tests (CPU, Memory, Compute, Rendering, Multi-Task) complete successfully.
3.  Check that the results display a Tier Ranking and are saved to the local `<powerpulse_benchmark_history>`.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### Built with ❤️ by **Vishrut Gupta**

<img src="assets/vishrut.jpg" width="150" alt="Vishrut Gupta" />

⚡ **PowerPulse** — *See your OS in action. Monitor it. Understand it. Optimize it.*

**12 Pages • 6 Scheduling Algorithms • 5 Benchmarks • 1 AI Assistant • Real-Time Everything**

</div>

---

## ⚠️ Copyright & Legal Notice

> **© 2025 Vishrut Gupta. All rights reserved.**
>
> This project, including all source code, documentation, design assets, UI components, and associated intellectual property, is the original work of **Vishrut Gupta** and is protected under the [MIT License](LICENSE).
>
> **Unauthorized reproduction, distribution, modification, or commercial use of this software or any of its components without explicit written permission from the author is strictly prohibited and may result in legal action.**
>
> If you wish to use, fork, or reference this project, you **must** provide proper attribution to the original author and retain all copyright notices in all copies or substantial portions of the software.
>
> For permissions, collaborations, or inquiries, please contact the author at **vishrugupta007@gmail.com** or via [GitHub](https://github.com/vishrutcodes).

**Disclaimer:** This software is provided "as is", without warranty of any kind, express or implied. The author shall not be held liable for any damages arising from the use of this software.
