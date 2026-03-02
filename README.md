<div align="center">

# ⚡ PowerPulse — OS Power Consumption Analyzer

### A Real-Time Operating System Power Consumption Analysis & Monitoring Platform

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Gemini AI](https://img.shields.io/badge/Gemini_2.5_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Monitor • Analyze • Optimize • Learn**

---

*PowerPulse bridges the gap between Operating System theory and real-world system behavior by providing live monitoring, interactive simulations, AI-powered insights, and educational tools — all in one beautiful, responsive dashboard.*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Pages & Modules](#-pages--modules)
- [API Reference](#-api-reference)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**PowerPulse** is a comprehensive, real-time Operating System Power Consumption Analyzer designed for students, developers, system administrators, and anyone interested in understanding how their operating system manages hardware resources. It combines:

- **Live System Monitoring** — CPU, memory, disk, network, battery, and thermal data streamed via WebSocket at 1-second intervals
- **Process Management** — Kill, suspend, resume, set priority, and pin processes to specific CPU cores
- **Historical Analysis** — Metrics logged every 60 seconds to SQLite with configurable time-range charts
- **Interactive OS Simulations** — CPU scheduler simulator (6 algorithms), kernel lab experiments, and benchmarks
- **AI-Powered Assistant** — Gemini 2.5 Flash chatbot that answers OS questions using live system data as context
- **Publication-Quality Reports** — Printable system reports with structured data and charts

PowerPulse is built with a modern, glassmorphic UI that supports both **dark and light themes**, features smooth **Framer Motion animations**, and is fully **responsive** across desktop and tablet screens.

---

## 🚀 Key Features

### Real-Time Monitoring
| Feature | Description |
|---------|-------------|
| **CPU Tracking** | Overall usage, per-core breakdown, frequency, core count |
| **Memory Analysis** | Used/total/available/cached/buffers with visual gauges |
| **Battery Monitoring** | Percentage, charging status, time remaining, power source |
| **Network I/O** | Real-time bytes sent/received rates with delta calculations |
| **Disk I/O** | Read/write throughput rates with live charts |
| **Thermal Monitoring** | Per-core temperatures, max/avg tracking, throttle detection |
| **Health Score** | Composite 0–100 score based on CPU, memory, disk, battery, swap |

### Process Management
| Action | Description |
|--------|-------------|
| **Graceful Kill** | Sends SIGTERM — process can save data before exiting |
| **Force Kill** | Sends SIGKILL — immediate termination, no save |
| **Kill Tree** | Terminates process and all child processes |
| **Force Kill Tree** | Aggressive tree kill via OS-level commands |
| **Suspend** | Pauses process execution (freezes in place) |
| **Resume** | Resumes a suspended process |
| **Set CPU Affinity** | Pin a process to specific CPU cores |
| **Set Priority** | Change to: idle, below_normal, normal, above_normal, high, realtime |

### AI-Powered Intelligence
- **Gemini 2.5 Flash** chatbot trained on OS fundamentals and all PowerPulse features
- Receives **live system metrics** (CPU, memory, battery, per-core temps, disk, processes) as context
- Answers questions about OS theory and connects them to what you observe in PowerPulse
- Maintains conversation history within each session

### Interactive Simulations
- **CPU Scheduler Simulator** — 6 algorithms with Gantt charts, comparison metrics, and statistics
- **Kernel Lab** — Hands-on OS kernel concept experiments
- **Benchmarks** — CPU, memory, disk, and network performance testing

---

## 🛠️ Technology Stack

### Backend

| Technology | Purpose |
|-----------|---------|
| **Python 3.8+** | Core backend language |
| **FastAPI** | High-performance async web framework |
| **Uvicorn** | ASGI server for FastAPI |
| **psutil** | Cross-platform system monitoring library |
| **WebSockets** | Real-time bidirectional data streaming |
| **SQLite** | Lightweight embedded database for metrics history |
| **Google GenAI** | Gemini 2.5 Flash API client for AI chatbot |
| **python-dotenv** | Environment variable management |
| **Rich** | Enhanced terminal output and formatting |

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18** | Component-based UI framework |
| **Vite 5** | Lightning-fast build tool and dev server |
| **Tailwind CSS 3.4** | Utility-first CSS framework |
| **Recharts 3** | Composable chart library for React |
| **Framer Motion 12** | Production-ready animation library |
| **React Router DOM 7** | Client-side routing and navigation |
| **Lucide React** | Beautiful, consistent icon library |
| **React-to-Print** | PDF/Print report generation |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | JavaScript linting and code quality |
| **PostCSS** | CSS processing pipeline |
| **Autoprefixer** | Automatic CSS vendor prefixes |

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │Dashboard │ │Processes │ │Scheduler │ │ AI Assistant   │  │
│  │Insights  │ │Resources │ │Kernel Lab│ │ (Gemini 2.5)  │  │
│  │History   │ │Thermal   │ │Benchmarks│ │               │  │
│  │Reports   │ │Settings  │ │          │ │               │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘  │
│       │             │            │               │           │
│       └─────────────┼────────────┼───────────────┘           │
│                     │ HTTP/WebSocket/REST                     │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI + Python)                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  api.py       │  │  monitor.py   │  │   database.py     │  │
│  │  REST + WS    │  │  psutil wrap  │  │   SQLite ORM      │  │
│  │  AI Chat      │  │  thermal info │  │   metrics.db      │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────────┘  │
│         │                 │                   │              │
│         ▼                 ▼                   ▼              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Operating System (via psutil)            │   │
│  │   CPU │ Memory │ Disk │ Network │ Battery │ Thermal   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **psutil** reads hardware counters from the OS kernel
2. **SystemMonitor** class wraps psutil into structured dataclasses (`CpuInfo`, `BatteryInfo`, `ProcessInfo`, etc.)
3. **FastAPI WebSocket** streams snapshots every 1 second to all connected clients
4. **SQLite** stores a snapshot every 60 seconds for historical analysis
5. **React frontend** renders live charts, gauges, and tables with smooth animations
6. **AI Assistant** injects live metrics into Gemini 2.5 Flash's context for personalized answers

---

## 📑 Pages & Modules

### 📊 Dashboard (`/` — Shortcut: `D`)
The command center of PowerPulse. Displays a real-time overview of all system metrics updated every second via WebSocket.

- **CPU Gauge** — Animated circular gauge showing overall CPU usage percentage and core count
- **Memory Gauge** — Used/total/available memory with percentage
- **Battery Card** — Percentage, charging state, estimated time remaining
- **Network I/O** — Live bytes sent/received rates (delta-calculated)
- **Disk I/O** — Live read/write throughput rates
- **Health Score** — Composite 0–100 metric (deducts for high CPU, memory, disk, low battery, high swap)
- **Per-Core CPU Bars** — Individual usage bar for each logical core
- **CPU History Chart** — Line chart of the last 60 CPU usage samples
- **System Info** — OS name, kernel version, boot time, load average

---

### 🛡️ Insights (`/insights` — Shortcut: `I`)
An intelligent advisory panel that analyzes your system state and provides actionable recommendations.

- **Health Score Gauge** — Animated SVG gauge (green ≥80, yellow ≥50, red <50) with smooth transitions
- **Health Score Algorithm** — Starts at 100, deducts points: CPU >80% (−15), memory >85% (−20), disk >90% (−15), battery <20% (−10), swap >50% (−10)
- **Smart Advisor** — Auto-generated suggestions with color-coded severity: 🔴 critical, 🟡 warning, 🔵 info, 🟢 success
- **Health Trend** — Mini SVG sparkline of recent health score history
- **Battery Card** — Charging/discharging status with time remaining
- **Load vs Cores** — Compares 1-min load average against CPU core count; warns if >1.0 per core
- **Did You Know?** — Rotating carousel of educational OS tips
- **Top Resource Hogs** — Top 5 processes by CPU% and top 5 by memory%
- **Memory Breakdown** — Used, Available, Cached, Buffers in formatted sizes
- **Swap Card** — Total/Used/Free/Percent with warning if >50%
- **Disk Partitions** — Table with device, mount, filesystem, total/used/free/percent (color-coded alerts ≥80% warning, ≥90% critical)
- **System Info Cards** — OS info, kernel version, boot time, load average (1/5/15 min)

---

### ⚡ Processes (`/processes` — Shortcut: `P`)
A full-featured process manager with search, sort, and per-process actions.

- **Process Table** — Up to 50 processes showing PID, name, CPU%, memory%, threads, handles, nice level, status
- **Search & Sort** — Filter by name, sort by any column
- **Process Actions** — Kill (graceful/force), kill tree, suspend, resume, set CPU affinity, set priority
- **Priority Levels** — Idle, below normal, normal, above normal, high, realtime
- **Process Details** — Expandable panel with detailed info: PID, status, CPU%, memory%, threads, handles, nice level, CPU affinity, I/O counters (read/write bytes and counts)
- **Process Tree** — Hierarchical parent-child view of the process tree
- **Status Indicators** — Color-coded: running (green), sleeping (blue), stopped (yellow), zombie (red)

---

### 🖥️ Resources (`/resources` — Shortcut: `R`)
Detailed resource utilization breakdowns with live-updating charts.

- **CPU Section** — Per-core usage bars, overall percentage, current frequency, logical core count
- **Memory Section** — Visual progress bar with used/total/available and percentage
- **Network Section** — Real-time sent/received rate charts with historical data
- **Disk Section** — Read/write rate charts with historical data
- **Auto-Update** — All charts refresh with WebSocket data every second

---

### 📈 History (`/history` — Shortcut: `H`)
Historical metric analysis with configurable time ranges.

- **Time Ranges** — 1 hour, 6 hours, 12 hours, 24 hours
- **Charts** — CPU usage, memory usage, battery level, network rates, disk rates, thermal data
- **Storage** — SQLite database (`metrics.db`) logging every 60 seconds
- **Rate Calculations** — Network/disk rates derived from cumulative counter diffs

---

### 📄 Reports (`/reports` — Shortcut: `E`)
Generate professional, printable system reports.

- **Report Content** — System info header, CPU statistics, memory breakdown, disk partitions, top processes, health suggestions
- **Print/PDF** — Uses `react-to-print` for native print dialog with PDF export
- **Formatting** — Proper page breaks, tables, headings, and print-optimized CSS

---

### 🧪 Kernel Lab (`/kernel-lab` — Shortcut: `K`)
Interactive OS kernel concept experiments and visualizations.

- **Educational Simulations** — Hands-on demonstrations of OS kernel concepts
- **Memory Management** — Visual experiments with paging, allocation, etc.
- **Process Scheduling** — See scheduling behavior in action

---

### 📊 Benchmarks (`/benchmarks` — Shortcut: `B`)
System performance benchmarking suite.

- **CPU Benchmark** — Computation-heavy tests with scoring
- **Memory Benchmark** — Allocation and access speed tests
- **Disk I/O Benchmark** — Read/write throughput measurements
- **Network Benchmark** — Throughput and latency tests
- **Results** — Displayed with charts and comparative analysis

---

### 🌡️ Thermal Monitor (`/thermal` — Shortcut: `T`)
Real-time temperature monitoring and throttle detection.

- **Per-Core Temperatures** — Individual sensor readings for each CPU core
- **Max & Average** — Overall thermal statistics
- **Temperature History** — Chart showing temperature trends over time
- **Throttle Detection** — Alerts when CPU temperature reaches critical thresholds
- **Cross-Platform** — Linux: `/sys/class/thermal`, macOS: `psutil.sensors_temperatures()`, Windows: Simulated based on CPU load with WMI fallback

---

### 📅 CPU Scheduler Simulator (`/scheduler` — Shortcut: `X`)
Interactive CPU scheduling algorithm simulator with side-by-side comparisons.

| Algorithm | Type | Description |
|-----------|------|-------------|
| **FCFS** | Non-preemptive | First Come First Served — processes execute in arrival order |
| **SJF** | Non-preemptive | Shortest Job First — shortest burst time runs first |
| **SRTF** | Preemptive | Shortest Remaining Time First — preemptive SJF variant |
| **Round Robin** | Preemptive | Time-quantum based scheduling with configurable quantum |
| **Priority (Non-preemptive)** | Non-preemptive | Lowest priority number runs first |
| **Priority (Preemptive)** | Preemptive | Preempts current process if higher-priority arrives |

**Features:**
- Add custom processes with arrival time, burst time, and priority
- **Gantt Chart** — Visual execution timeline
- **Metrics** — Waiting time, turnaround time, response time, CPU utilization per algorithm
- **Comparison Mode** — Bar charts, scatter plots, and radar charts comparing all algorithms
- **Statistics** — Average waiting time and turnaround time per algorithm

---

### ⚙️ Settings (`/settings` — Shortcut: `S`)
Application configuration and preferences.

- **Theme Toggle** — Dark mode / Light mode with `localStorage` persistence
- **Alert Thresholds** — Customize CPU, memory, and battery alert thresholds
- **System Preferences** — Configuration options for monitoring behavior

---

### 🤖 AI Assistant (`/ai-assistant` — Shortcut: `A`)
An intelligent chatbot powered by **Google Gemini 2.5 Flash**.

- **Scoped Knowledge** — Answers only OS concepts and PowerPulse-related questions
- **Live Data Context** — Every request includes: per-core CPU usage, per-sensor temperatures, memory breakdown, swap, battery, disk partitions, health score, top processes, system suggestions
- **Markdown Responses** — Bold text, bullet lists, code blocks rendered directly in chat
- **Suggested Questions** — Clickable starter prompts for quick exploration
- **Chat History** — Conversation context maintained within the session
- **Polite Refusal** — Gracefully declines off-topic questions and redirects to OS topics

---

## 📡 API Reference

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `WS /ws/metrics` | Real-time system data stream (1 update/second) |

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/history?hours=N` | Historical metrics for the last N hours |
| `POST` | `/api/process/{pid}/kill` | Gracefully terminate a process |
| `POST` | `/api/process/{pid}/force-kill` | Force kill a process immediately |
| `POST` | `/api/process/{pid}/kill-tree` | Terminate process and children |
| `POST` | `/api/process/{pid}/force-kill-tree` | Force kill entire process tree |
| `POST` | `/api/process/{pid}/suspend` | Suspend a running process |
| `POST` | `/api/process/{pid}/resume` | Resume a suspended process |
| `POST` | `/api/process/{pid}/affinity` | Set CPU affinity `{cores: [0,1]}` |
| `POST` | `/api/process/{pid}/priority` | Set priority `{priority: "normal"}` |
| `GET` | `/api/process/{pid}/details` | Detailed process information |
| `GET` | `/api/process/tree` | Hierarchical process tree |
| `POST` | `/api/chat` | AI chatbot `{message, history}` |

### Interactive Docs
Once the backend is running, access the **Swagger UI** at:
```
http://127.0.0.1:8000/docs
```

---

## ⌨️ Keyboard Shortcuts

| Key | Page |
|-----|------|
| `D` | Dashboard |
| `I` | Insights |
| `P` | Processes |
| `R` | Resources |
| `H` | History |
| `E` | Reports |
| `K` | Kernel Lab |
| `B` | Benchmarks |
| `T` | Thermal Monitor |
| `X` | CPU Scheduler Simulator |
| `A` | AI Assistant |
| `S` | Settings |
| `Esc` | Close modals / dialogs |

---

## 📋 Prerequisites

| Requirement | Version |
|------------|---------|
| **Python** | 3.8 or higher |
| **Node.js** | 16.x or higher |
| **npm** | 8.x or higher |
| **Gemini API Key** | Required for AI Assistant ([Get one here](https://aistudio.google.com/apikey)) |

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

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Linux/macOS)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `PowerPulse/` directory:

```env
GEMINI_API_KEY=your_api_key_here
```

> 💡 Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

---

## 🚀 Usage

### One-Click Start (Windows)

```bash
cd PowerPulse
run_app.bat
```

This automatically starts both the backend and frontend servers.

### Manual Start

**Terminal 1 — Backend:**

```bash
cd PowerPulse
.venv\Scripts\activate
cd src
uvicorn powerpulse.api:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — Frontend:**

```bash
cd PowerPulse/frontend
npm run dev
```

### Access the Application

| Service | URL |
|---------|-----|
| **Frontend Dashboard** | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | [http://127.0.0.1:8000](http://127.0.0.1:8000) |
| **API Docs (Swagger)** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) |

---

## 📁 Project Structure

```
Operating Systems Power Consumption Analyzer/
├── PowerPulse/
│   ├── frontend/                    # React Frontend Application
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.jsx     # Real-time system overview
│   │   │   │   ├── Insights.jsx      # Health score & suggestions
│   │   │   │   ├── Processes.jsx     # Process manager
│   │   │   │   ├── Resources.jsx     # Resource utilization
│   │   │   │   ├── History.jsx       # Historical metrics charts
│   │   │   │   ├── Reports.jsx       # Printable system reports
│   │   │   │   ├── KernelLab.jsx     # OS kernel experiments
│   │   │   │   ├── Benchmarks.jsx    # Performance benchmarks
│   │   │   │   ├── ThermalMonitor.jsx# Temperature monitoring
│   │   │   │   ├── SchedulerSimulator.jsx # CPU scheduling sim
│   │   │   │   ├── AIAssistant.jsx   # Gemini AI chatbot
│   │   │   │   └── Settings.jsx      # App configuration
│   │   │   ├── hooks/
│   │   │   │   └── useAlerts.js      # Alert threshold hook
│   │   │   ├── App.jsx               # Routing & context providers
│   │   │   ├── Layout.jsx            # Sidebar navigation & shortcuts
│   │   │   ├── config.js             # API base URL configuration
│   │   │   └── index.css             # Global styles & design system
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   ├── src/
│   │   └── powerpulse/               # Python Backend Package
│   │       ├── api.py                # FastAPI app, REST + WebSocket + AI
│   │       ├── monitor.py            # System monitoring (psutil wrapper)
│   │       ├── database.py           # SQLite database operations
│   │       └── __init__.py
│   │
│   ├── .env                          # Environment variables (API keys)
│   ├── metrics.db                    # SQLite database (auto-created)
│   ├── requirements.txt              # Python dependencies
│   ├── pyproject.toml                # Python project configuration
│   └── run_app.bat                   # Windows one-click launcher
│
└── README.md                         # This file
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes (for AI) | Google Gemini API key for the AI Assistant |

### Theme

PowerPulse supports **dark mode** (default) and **light mode**. Toggle via the Settings page or the theme switch. Preference is saved to `localStorage`.

### Alerts

Configure custom alert thresholds for:
- **CPU Usage** — Trigger warning when CPU exceeds threshold
- **Memory Usage** — Trigger warning when memory exceeds threshold
- **Battery Level** — Trigger warning when battery drops below threshold

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
- Test your changes with both dark and light themes
- Ensure responsive layout works on different screen sizes

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for Operating Systems education and system optimization**

⚡ PowerPulse — *See your OS in action*

</div>
