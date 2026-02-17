import { useState, useEffect } from 'react';
import { Save, Bell, AlertTriangle, Battery, Cpu, Sun, Moon, Volume2 } from 'lucide-react';

const THEME_KEY = 'powerpulse_theme';

function Settings() {
    const [settings, setSettings] = useState({
        cpuThreshold: 90,
        memThreshold: 85,
        batteryThreshold: 20,
        enableNotifications: false,
        enableAlertSound: false
    });

    const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const savedSettings = localStorage.getItem('powerpulse_settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const setTheme = (value) => {
        setThemeState(value);
        localStorage.setItem(THEME_KEY, value);
        document.documentElement.setAttribute('data-theme', value);
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        localStorage.setItem('powerpulse_settings', JSON.stringify(settings));

        // Request permission if enabling
        if (settings.enableNotifications && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex justify-between items-center bg-slate-800/40 p-6 rounded-xl border border-white/5 backdrop-blur-md">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                        <Bell className="text-cyan-400" /> Alerts & Preferences
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Configure when you want to be notified about system events.</p>
                </div>

                <button
                    onClick={handleSave}
                    className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 shadow-lg ${saved ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105'}`}
                >
                    <Save size={18} className={saved ? 'animate-bounce' : ''} /> {saved ? 'Saved!' : 'Save Config'}
                </button>
            </div>

            <div className="glass-panel p-8 max-w-2xl mx-auto w-full">
                {/* Theme */}
                <div className="mb-8 flex items-center justify-between border-b border-slate-700 pb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            {theme === 'dark' ? <Moon size={20} className="text-cyan-400" /> : <Sun size={20} className="text-cyan-400" />}
                            Appearance
                        </h3>
                        <p className="text-sm text-slate-400">Choose dark or light theme.</p>
                    </div>
                    <div className="flex rounded-lg overflow-hidden border border-slate-700">
                        <button
                            onClick={() => setTheme('dark')}
                            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${theme === 'dark' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'}`}
                        >
                            <Moon size={16} /> Dark
                        </button>
                        <button
                            onClick={() => setTheme('light')}
                            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${theme === 'light' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'}`}
                        >
                            <Sun size={16} /> Light
                        </button>
                    </div>
                </div>

                <div className="mb-6 flex items-center justify-between border-b border-slate-700 pb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-100">Desktop Notifications</h3>
                        <p className="text-sm text-slate-400">Allow Operating Systems Power Consumption Analyzer to send native system alerts.</p>
                    </div>
                    <div
                        onClick={() => handleChange('enableNotifications', !settings.enableNotifications)}
                        className={`w-14 h-8 rounded-full cursor-pointer relative transition-all duration-300 ${settings.enableNotifications ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${settings.enableNotifications ? 'left-7' : 'left-1'}`}></div>
                    </div>
                </div>

                <div className="mb-8 flex items-center justify-between border-b border-slate-700 pb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <Volume2 size={20} className="text-cyan-400" /> Alert sound
                        </h3>
                        <p className="text-sm text-slate-400">Play a short beep when an alert fires (CPU / Memory / Battery).</p>
                    </div>
                    <div
                        onClick={() => handleChange('enableAlertSound', !settings.enableAlertSound)}
                        className={`w-14 h-8 rounded-full cursor-pointer relative transition-all duration-300 ${settings.enableAlertSound ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${settings.enableAlertSound ? 'left-7' : 'left-1'}`}></div>
                    </div>
                </div>

                <div className={`space-y-8 transition-opacity ${settings.enableNotifications ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>

                    {/* CPU Threshold */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="flex items-center gap-2 text-slate-200 font-medium">
                                <Cpu size={18} className="text-cyan-400" /> CPU High Warning
                            </label>
                            <span className="text-cyan-400 font-mono font-bold">{settings.cpuThreshold}%</span>
                        </div>
                        <input
                            type="range" min="50" max="99"
                            value={settings.cpuThreshold}
                            onChange={(e) => handleChange('cpuThreshold', parseInt(e.target.value))}
                            className="w-full accent-cyan-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-slate-500 mt-1">Alert when processor usage exceeds this value.</p>
                    </div>

                    {/* Memory Threshold */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="flex items-center gap-2 text-slate-200 font-medium">
                                <AlertTriangle size={18} className="text-purple-400" /> Memory High Warning
                            </label>
                            <span className="text-purple-400 font-mono font-bold">{settings.memThreshold}%</span>
                        </div>
                        <input
                            type="range" min="50" max="99"
                            value={settings.memThreshold}
                            onChange={(e) => handleChange('memThreshold', parseInt(e.target.value))}
                            className="w-full accent-purple-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-slate-500 mt-1">Alert when RAM usage exceeds this value.</p>
                    </div>

                    {/* Battery Threshold */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="flex items-center gap-2 text-slate-200 font-medium">
                                <Battery size={18} className="text-red-400" /> Battery Low Warning
                            </label>
                            <span className="text-red-400 font-mono font-bold">{settings.batteryThreshold}%</span>
                        </div>
                        <input
                            type="range" min="5" max="50"
                            value={settings.batteryThreshold}
                            onChange={(e) => handleChange('batteryThreshold', parseInt(e.target.value))}
                            className="w-full accent-red-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-slate-500 mt-1">Alert when battery drops below this value (while unplugged).</p>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Settings;
