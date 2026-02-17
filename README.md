# PowerPulse: OS Power Consumption Analyzer

PowerPulse is a real-time Operating System power consumption analysis tool designed to monitor, visualize, and optimize system performance. It provides detailed insights into CPU usage, memory consumption, battery health, thermal statistics, and per-process power impact.

## Features

- **Real-Time Monitoring**: Live tracking of CPU, Memory, Disk I/O, Network I/O, and Battery status.
- **Process Analysis**: Identify power-hungry processes with a custom "Power Score".
- **Thermal Monitoring**: Monitor CPU temperatures and throttle status (supported on Linux/macOS, simulated/WMI fallback on Windows).
- **Interactive Dashboard**: A modern, responsive web interface built with React and Tailwind CSS.
- **Process Management**: Suspend, resume, or terminate processes directly from the dashboard.
- **Historical Data**: View historical trends for power usage and system metrics.
- **CORS Support**: API configured to allow cross-origin requests for flexible development.

## Technology Stack

- **Backend**: Python (FastAPI, Uvicorn, WebSockets, Psutil)
- **Frontend**: React (Vite, Tailwind CSS, Recharts, Framer Motion)
- **Data Storage**: SQLite (for historical metrics)

## Prerequisites

- **Python**: 3.8 or higher
- **Node.js**: 16.x or higher
- **npm**: 8.x or higher

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Operating Systems Power Consumption Analyzer"
```

### 2. Backend Setup

Navigate to the `PowerPulse` directory and install Python dependencies.

```bash
cd PowerPulse
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend Setup

Navigate to the `frontend` directory and install Node.js dependencies.

```bash
cd frontend
npm install
```

## Usage

### One-Click Start (Windows)

Simply run the provided batch script in the `PowerPulse` directory:

```bash
run_app.bat
```

This script will automatically:
1. Activate the Python virtual environment.
2. Start the FastAPI backend server.
3. Start the React frontend development server.

### Manual Start

**Backend:**

```bash
cd PowerPulse/src
uvicorn powerpulse.api:app --reload --host 127.0.0.1 --port 8000
```

**Frontend:**

```bash
cd PowerPulse/frontend
npm run dev
```

Open your browser and navigate to `http://localhost:5173` to view the dashboard.

## API Documentation

Once the backend is running, you can access the interactive API documentation (Swagger UI) at:

`http://127.0.0.1:8000/docs`

### Key Endpoints:

- `GET /api/history`: Retrieve historical system metrics.
- `POST /api/process/{pid}/kill`: Terminate a specific process.
- `POST /api/process/{pid}/suspend`: Suspend a process.
- `WS /ws/metrics`: WebSocket endpoint for real-time data streaming.

## Project Structure

```
PowerPulse/
â”œâ”€â”€ frontend/           # React frontend application
â”œâ”€â”€ src/
â”‚   â””â”€â”€ powerpulse/     # Python backend package
â”‚       â”œâ”€â”€ api.py        # FastAPI application and endpoints
â”‚       â”œâ”€â”€ monitor.py    # System monitoring logic (psutil)
â”‚       â”œâ”€â”€ database.py   # Database interactions
â”‚       â””â”€â”€ ...
â”œâ”€â”€ requirements.txt    # Python dependencies
â”œâ”€â”€ run_app.bat         # Windows startup script
â””â”€â”€ ...
```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.
