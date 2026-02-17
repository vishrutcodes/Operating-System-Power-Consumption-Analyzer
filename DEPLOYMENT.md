# Deployment Guide

PowerPulse is designed as a local system monitor, but it can be deployed in several ways depending on your needs.

## 1. Local Network Deployment (LAN)

To access the dashboard from other devices on your local network (e.g., monitor your PC from your phone):

1.  **Find your Local IP Address**:
    -   Windows: Open terminal, run `ipconfig`. Look for "IPv4 Address" (e.g., `192.168.1.5`).
    -   Linux/Mac: Run `ifconfig` or `ip a`.

2.  **Start the Backend on 0.0.0.0**:
    By default, the backend runs on `127.0.0.1` (localhost only). To open it to the network, use this command:

    ```bash
    cd PowerPulse/src
    python -m uvicorn powerpulse.api:app --reload --host 0.0.0.0 --port 8000
    ```

3.  **Start the Frontend**:
    
    ```bash
    cd PowerPulse/frontend
    npm run dev -- --host
    ```

4.  **Access from other devices**:
    Open a browser on your phone or other laptop and go to: `http://<YOUR_IP_ADDRESS>:5173`
    
    *Note: The app will automatically detect the backend IP address.*

## 2. Standalone Executable (Windows .exe)

You can package PowerPulse into a single `.exe` file for easy distribution.

1.  **Install PyInstaller**:
    ```bash
    pip install pyinstaller
    ```

2.  **Build the Frontend**:
    ```bash
    cd PowerPulse/frontend
    npm run build
    ```

3.  **Create a Spec File**:
    Create a file named `powerpulse.spec` in `PowerPulse/src` to bundle the Python code and the React `dist` folder.

    *(Detailed instructions require configuring PyInstaller to serve static files from the backend)*.

## 3. Server Deployment (Remote Monitoring)

If you want to monitor a remote server (e.g., a VPS or Home Lab server):

1.  **Clone Repo on Server**:
    ```bash
    git clone https://github.com/vishrutcodes/Operating-System-Power-Consumption-Analyzer.git
    cd "Operating Systems Power Consumption Analyzer"
    ```

2.  **Setup Backend**:
    ```bash
    cd PowerPulse
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Build Frontend**:
    ```bash
    cd frontend
    npm install
    npm run build
    ```
    *(You can also build locally and SCP the `dist` folder to the server)*

4.  **Run with Production Server**:
    We recommend using a process manager like `systemd` or `supervisor`.
    
    Command to run:
    ```bash
    # Ensure deployment includes the frontend build serving logic or run them separately
    uvicorn powerpulse.api:app --host 0.0.0.0 --port 8000
    ```

    *Note: You will need to configure the backend to serve the frontend static files if you want a single-port deployment, or serve the `dist` folder with Nginx.*
