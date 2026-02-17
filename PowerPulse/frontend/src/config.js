/**
 * API Configuration
 * 
 * Determines the backend URL based on the current environment.
 * - In Development (Vite running on 5173): Connects to localhost:8000
 * - In Production (Served by unknown host): Connects to the same host on port 8000 
 *   (or relative path if backend serves frontend)
 */

const getBaseUrl = () => {
    // If we are in development mode (Vite), usually strictly localhost:8000
    if (import.meta.env.DEV) {
        return "http://127.0.0.1:8000";
    }

    // In production/deployment, we want to adapt to the hostname
    // Example: If accessing from 192.168.1.5:5173 (or served static), 
    // we assume backend is on the SAME host at port 8000.
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // If served on port 8000 (backend serving frontend), use relative path
    if (window.location.port === "8000") {
        return "";
    }
    // Otherwise assume backend is on port 8000 of the same host
    return `${protocol}//${hostname}:8000`;
};

const getWsUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    if (import.meta.env.DEV) {
        return "ws://127.0.0.1:8000/ws/metrics";
    }

    const hostname = window.location.hostname;
    // If served on port 8000
    if (window.location.port === "8000") {
        return `${protocol}//${hostname}:${window.location.port}/ws/metrics`;
    }

    return `${protocol}//${hostname}:8000/ws/metrics`;
};

export const API_BASE = getBaseUrl();
export const WS_URL = getWsUrl();
