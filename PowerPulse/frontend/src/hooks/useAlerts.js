import { useEffect, useRef } from 'react';

const COOLDOWN = 60000 * 5; // 5 minutes cool-down per alert type

export function useAlerts(data) {
    const lastAlerts = useRef({ cpu: 0, mem: 0, batt: 0 });

    function playAlertBeep() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gain.gain.setValueAtTime(0.2, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (_) {}
    }

    useEffect(() => {
        if (!data) return;

        const saved = localStorage.getItem('powerpulse_settings');
        if (!saved) return;

        const settings = JSON.parse(saved);
        if (!settings.enableNotifications) return;

        const now = Date.now();
        const playSound = !!settings.enableAlertSound;

        // CPU Check
        if (data.cpu.usage_percent > settings.cpuThreshold && (now - lastAlerts.current.cpu > COOLDOWN)) {
            new Notification("High CPU Usage", {
                body: `CPU load is at ${data.cpu.usage_percent.toFixed(1)}%.`,
                icon: '/favicon.ico'
            });
            if (playSound) playAlertBeep();
            lastAlerts.current.cpu = now;
        }

        // Memory Check (data.memory from API payload has percent)
        if (data.memory?.percent != null && data.memory.percent > settings.memThreshold && (now - lastAlerts.current.mem > COOLDOWN)) {
            new Notification("High Memory Usage", {
                body: `RAM usage is at ${data.memory.percent.toFixed(1)}%.`,
                icon: '/favicon.ico'
            });
            if (playSound) playAlertBeep();
            lastAlerts.current.mem = now;
        }

        // Battery Check
        if (data.battery.percent < settings.batteryThreshold && !data.battery.power_plugged && (now - lastAlerts.current.batt > COOLDOWN)) {
            new Notification("Low Battery", {
                body: `Battery is at ${data.battery.percent}%. Connect charger.`,
                icon: '/favicon.ico'
            });
            if (playSound) playAlertBeep();
            lastAlerts.current.batt = now;
        }
    }, [data]);
}
