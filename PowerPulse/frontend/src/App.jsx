import { useState, useEffect, useRef, createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import DashboardPage from './pages/Dashboard';
import ProcessesPage from './pages/Processes';
import ResourcesPage from './pages/Resources';
import InsightsPage from './pages/Insights';
import ReportsPage from './pages/Reports';
import HistoryPage from './pages/History';
import SettingsPage from './pages/Settings';
import KernelLabPage from './pages/KernelLab';
import ThermalMonitorPage from './pages/ThermalMonitor';

import BenchmarksPage from './pages/Benchmarks';
import { useAlerts } from './hooks/useAlerts';

// eslint-disable-next-line react-refresh/only-export-components -- context is used by Layout and pages
export const MetricsContext = createContext(null);

const API_URL = "ws://127.0.0.1:8000/ws/metrics";

function App() {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [history, setHistory] = useState({
    cpu: [],
    net: [],
    disk: [],
    health: [],
    thermal: []
  });
  const ws = useRef(null);

  // Apply saved theme on load
  useEffect(() => {
    const theme = localStorage.getItem('powerpulse_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  // Initialize Alerts Hook
  useAlerts(data);

  useEffect(() => {
    const connect = () => {
      // Use 127.0.0.1 to avoid IPv6 issues on Windows
      ws.current = new WebSocket('ws://127.0.0.1:8000/ws/metrics');

      ws.current.onopen = () => {
        console.log("Connected to Operating Systems Power Consumption Analyzer WS");
        setIsConnected(true);
      };

      ws.current.onclose = () => {
        console.log("Disconnected. Retrying...");
        setIsConnected(false);
        // Optional: Auto-reconnect logic could go here
      };

      ws.current.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          // Use functional state update to access previous data for rate calc
          setData(prevData => {
            // We need previous raw values to calculate rate. 
            // prevData might be null initially.
            return payload;
          });

          const now = new Date().toLocaleTimeString();

          setHistory(prev => {
            const limit = 60;

            const cpuUsage = payload.cpu?.usage_percent || 0;
            const netIo = payload.net_io || { bytes_sent: 0, bytes_recv: 0 };
            const diskIo = payload.disk_io || { read_bytes: 0, write_bytes: 0 };

            // Get last data points to calc diffs
            const lastNet = prev.net[prev.net.length - 1] || { raw_sent: 0, raw_recv: 0 };
            const lastDisk = prev.disk[prev.disk.length - 1] || { raw_read: 0, raw_write: 0 };

            // Calculate Rates (Bytes per second, assuming ~1s interval)
            // Handle initial case where diff would be huge magnitude if we start from 0?
            // Or just sanitize negative/huge jumps.

            let sentRate = 0;
            let recvRate = 0;
            let readRate = 0;
            let writeRate = 0;

            if (prev.net.length > 0) {
              sentRate = Math.max(0, netIo.bytes_sent - lastNet.raw_sent);
              recvRate = Math.max(0, netIo.bytes_recv - lastNet.raw_recv);
            }

            if (prev.disk.length > 0) {
              readRate = Math.max(0, diskIo.read_bytes - lastDisk.raw_read);
              writeRate = Math.max(0, diskIo.write_bytes - lastDisk.raw_write);
            }

            const newCpu = [...prev.cpu, { time: now, usage: cpuUsage }].slice(-limit);

            const newNet = [...prev.net, {
              time: now,
              sent_rate: sentRate,
              recv_rate: recvRate,
              raw_sent: netIo.bytes_sent,
              raw_recv: netIo.bytes_recv
            }].slice(-limit);

            const newDisk = [...prev.disk, {
              time: now,
              read_rate: readRate,
              write_rate: writeRate,
              raw_read: diskIo.read_bytes,
              raw_write: diskIo.write_bytes
            }].slice(-limit);

            const healthScore = payload.health_score ?? 0;
            const newHealth = [...(prev.health || []), { time: now, score: healthScore }].slice(-limit);

            const thermalMax = payload.thermal?.max_temp || 0;
            const thermalAvg = payload.thermal?.avg_temp || 0;
            const newThermal = [...(prev.thermal || []), { time: now, max: thermalMax, avg: thermalAvg }].slice(-limit);

            return { cpu: newCpu, net: newNet, disk: newDisk, health: newHealth, thermal: newThermal };
          });
        } catch (err) {
          console.error("Error parsing WS data:", err);
        }
      };
    };

    connect();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  return (
    <MetricsContext.Provider value={{ data, history, isConnected }}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout connectionStatus={isConnected} />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/processes" element={<ProcessesPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/kernel-lab" element={<KernelLabPage />} />

            <Route path="/benchmarks" element={<BenchmarksPage />} />
            <Route path="/thermal" element={<ThermalMonitorPage />} />


            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MetricsContext.Provider>
  );
}

export default App;
