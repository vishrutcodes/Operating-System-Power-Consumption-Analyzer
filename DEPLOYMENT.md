# 🚀 PowerPulse — Deployment Guide

A simple step-by-step guide to get PowerPulse running on your desktop.

---

## ✅ Prerequisites

Make sure these are installed on your computer:

| Tool | Download Link | Check Command |
|------|--------------|---------------|
| **Python 3.8+** | [python.org/downloads](https://www.python.org/downloads/) | `python --version` |
| **Node.js 16+** | [nodejs.org](https://nodejs.org/) | `node --version` |
| **npm 8+** | Comes with Node.js | `npm --version` |
| **Git** | [git-scm.com](https://git-scm.com/downloads) | `git --version` |

---

## 📥 Step 1: Clone the Repository

Open a terminal (Command Prompt / PowerShell / Terminal) and run:

```bash
git clone https://github.com/vishrutcodes/Operating-System-Power-Consumption-Analyzer.git
```

Then navigate into the project folder:

```bash
cd "Operating Systems Power Consumption Analyzer"
```

---

## 🐍 Step 2: Set Up the Backend (Python)

Navigate to the PowerPulse directory:

```bash
cd PowerPulse
```

### 2a. Create a Virtual Environment

```bash
python -m venv .venv
```

### 2b. Activate the Virtual Environment

**Windows (Command Prompt):**
```bash
.venv\Scripts\activate
```

**Windows (PowerShell):**
```bash
.venv\Scripts\Activate.ps1
```

**Linux / macOS:**
```bash
source .venv/bin/activate
```

> ✅ You should see `(.venv)` at the beginning of your terminal prompt.

### 2c. Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs: `psutil`, `fastapi`, `uvicorn`, `websockets`, `google-genai`, `python-dotenv`, `rich`

---

## 🌐 Step 3: Set Up the Frontend (React)

Open a **new terminal** and navigate to the frontend folder:

```bash
cd "Operating Systems Power Consumption Analyzer/PowerPulse/frontend"
```

Install Node.js dependencies:

```bash
npm install
```

---

## 🔑 Step 4: Configure the AI Assistant (Optional)

If you want the AI chatbot to work, you need a free Gemini API key:

1. Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click **"Create API Key"**
3. Copy the key

Then create a `.env` file inside the `PowerPulse/` folder:

```bash
# File: PowerPulse/.env
GEMINI_API_KEY=paste_your_api_key_here
```

> 💡 The rest of the app works perfectly fine without this key. Only the AI Assistant page needs it.

---

## ▶️ Step 5: Start the Application

You need **two terminals** running at the same time.

### Terminal 1 — Start the Backend

```bash
cd "Operating Systems Power Consumption Analyzer/PowerPulse"
.venv\Scripts\activate
cd src
uvicorn powerpulse.api:app --reload --host 127.0.0.1 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

### Terminal 2 — Start the Frontend

```bash
cd "Operating Systems Power Consumption Analyzer/PowerPulse/frontend"
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

---

## 🖥️ Step 6: Open in Browser

Open your browser and go to:

### 👉 [http://localhost:5173](http://localhost:5173)

That's it! PowerPulse is now running on your desktop. 🎉

---

## ⚡ Quick Start (Windows Only)

Instead of Steps 5 & 6, you can simply double-click:

```
PowerPulse/run_app.bat
```

This automatically starts both servers for you.

---

## 🛑 How to Stop

- **Backend**: Press `Ctrl + C` in Terminal 1
- **Frontend**: Press `Ctrl + C` in Terminal 2

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| `python not found` | Install Python from [python.org](https://www.python.org/downloads/) and add to PATH |
| `node not found` | Install Node.js from [nodejs.org](https://nodejs.org/) |
| `pip install fails` | Make sure virtual environment is activated (you should see `(.venv)`) |
| `npm install fails` | Delete `node_modules` folder and run `npm install` again |
| Backend shows errors | Make sure you're in the `src/` folder when running uvicorn |
| Frontend can't connect | Make sure the backend is running on port 8000 first |
| AI Assistant not working | Check that `.env` file has a valid `GEMINI_API_KEY` |
| Charts show no data | Wait a few seconds — WebSocket needs to connect |
| `PowerShell script blocked` | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Port 8000 already in use | Kill the process: `netstat -ano \| findstr :8000` then `taskkill /PID <pid> /F` |

---

## 📌 Quick Reference

| What | URL |
|------|-----|
| **App** | [http://localhost:5173](http://localhost:5173) |
| **API** | [http://127.0.0.1:8000](http://127.0.0.1:8000) |
| **API Docs** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) |

---
<div align="center">

### Built with ❤️ by **Vishrut Gupta**

<img src="assets/vishrut.jpg" width="150" alt="Vishrut Gupta" />

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
> For permissions, collaborations, or inquiries, please contact the author via [GitHub](https://github.com/vishrutcodes).

**Disclaimer:** This software is provided "as is", without warranty of any kind, express or implied. The author shall not be held liable for any damages arising from the use of this software.
