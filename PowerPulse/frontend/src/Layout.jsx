import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Zap, Activity, Cpu, Layers, ShieldCheck, FileText, History as HistoryIcon, Settings, Beaker, Info, Gauge, Brain, Thermometer, Power, GraduationCap } from 'lucide-react';

const SHORTCUTS = [
    { key: 'd', path: '/', label: 'Dashboard' },
    { key: 'i', path: '/insights', label: 'Insights' },
    { key: 'p', path: '/processes', label: 'Processes' },
    { key: 'r', path: '/resources', label: 'Resources' },
    { key: 'h', path: '/history', label: 'History' },
    { key: 'e', path: '/reports', label: 'Reports' },
    { key: 'k', path: '/kernel-lab', label: 'Kernel Lab' },
    { key: 'b', path: '/benchmarks', label: 'Benchmarks' },
    { key: 't', path: '/thermal', label: 'Thermal Monitor' },

    { key: 'x', path: '/scheduler', label: 'CPU Scheduler' },
    { key: 's', path: '/settings', label: 'Settings' },
];

function Layout({ connectionStatus }) {
    const navigate = useNavigate();
    const [aboutOpen, setAboutOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
            const key = e.key.toLowerCase();
            const shortcut = SHORTCUTS.find(s => s.key === key);
            if (shortcut) {
                e.preventDefault();
                navigate(shortcut.path);
            }
            if (e.key === 'Escape') setAboutOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    const navItems = [
        { path: "/", label: "Dashboard", icon: <Layers size={20} /> },
        { path: "/insights", label: "Insights", icon: <ShieldCheck size={20} /> },
        { path: "/processes", label: "Processes", icon: <Activity size={20} /> },
        { path: "/resources", label: "Resources", icon: <Cpu size={20} /> },
        { path: "/history", label: "History", icon: <HistoryIcon size={20} /> },
        { path: "/reports", label: "Reports", icon: <FileText size={20} /> },
        { path: "/kernel-lab", label: "Kernel Lab", icon: <Beaker size={20} /> },
        { path: "/benchmarks", label: "Benchmarks", icon: <Gauge size={20} /> },
        { path: "/thermal", label: "Thermal Monitor", icon: <Thermometer size={20} /> },

        { path: "/scheduler", label: "CPU Scheduler", icon: <GraduationCap size={20} /> },
        { path: "/settings", label: "Settings", icon: <Settings size={20} /> },
    ];

    return (
        <div className="flex h-screen w-full bg-slate-900 text-slate-100 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800/20 backdrop-blur-xl border-r border-white/5 flex flex-col min-h-0 p-4">
                <div className="flex flex-col gap-2 mb-8 px-2 shrink-0 animate-fade-in-up">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-cyan-400/80">Operating Systems EL Project</h2>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/50 icon-glow">
                            <Zap className="text-cyan-400" size={24} />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease_infinite]">
                            Power Consumption Analyzer
                        </h1>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1">
                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive
                                        ? "bg-sky-500/10 text-sky-400 font-medium shadow-[0_0_20px_rgba(14,165,233,0.1)] border border-sky-500/20"
                                        : "text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 hover:border hover:border-sky-500/20"}
              `}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* About / Tips */}
                    <button
                        type="button"
                        onClick={() => setAboutOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:text-cyan-400 hover:bg-white/5 transition-colors text-sm mb-2 w-full mt-4"
                    >
                        <Info size={16} /> About &amp; shortcuts
                    </button>
                </div>

                {/* Status Footer */}
                <div className="mt-auto shrink-0 px-4 py-3 rounded-xl border border-sky-500/20 bg-sky-500/10 hover:bg-sky-500/10 transition-all duration-300">
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full status-pulse ${connectionStatus ? 'bg-green-500 text-green-500' : 'bg-red-500 text-red-500'}`}></div>
                        <span className="text-xs text-sky-400 font-mono tracking-wider">
                            {connectionStatus ? 'SYSTEM ONLINE' : 'DISCONNECTED'}
                        </span>
                    </div>
                    <div className="text-[10px] text-sky-400/60 mt-1">v1.2.0 • Localhost</div>
                </div>
            </aside>

            {/* About & Shortcuts modal */}
            {aboutOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up" onClick={() => setAboutOpen(false)}>
                    <div className="about-modal border rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold about-modal-title flex items-center gap-2">
                                <Zap className="text-cyan-500" /> Operating Systems Power Consumption Analyzer
                            </h2>
                            <button className="about-modal-close text-xl leading-none" onClick={() => setAboutOpen(false)}>×</button>
                        </div>
                        <p className="about-modal-text text-sm mb-4">
                            Real-time OS power &amp; system monitoring. Process management, memory &amp; swap, disk partitions, reports, and alerts.
                        </p>
                        <h3 className="text-sm font-bold about-modal-heading mb-2">Keyboard shortcuts</h3>
                        <ul className="text-xs about-modal-text space-y-1 mb-4">
                            {SHORTCUTS.map(s => (
                                <li key={s.key}><kbd className="px-1.5 py-0.5 rounded about-modal-kbd font-mono">{s.key}</kbd> → {s.label}</li>
                            ))}
                        </ul>
                        <p className="text-xs about-modal-muted">Press <kbd className="px-1 rounded about-modal-kbd">Esc</kbd> to close. v1.2.0</p>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default Layout;
