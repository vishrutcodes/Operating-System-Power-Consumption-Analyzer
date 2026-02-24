import { useContext, useMemo } from 'react';
import { MetricsContext } from '../App';
import { ShieldCheck, AlertTriangle, Info, Clock, CheckCircle, HardDrive, Cpu, MemoryStick, Battery, TrendingUp, Lightbulb, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const TIPS = [
    'Closing unused browser tabs frees RAM and can improve responsiveness.',
    'High swap usage often means the system is low on RAM—closing apps helps.',
    'Load average above your CPU core count suggests the system is overloaded.',
    'Keeping disk usage under 90% helps avoid slowdowns and update failures.',
];

function formatBytes(bytes) {
    if (bytes == null || bytes === 0) return '0 B';
    const gb = bytes / (1024 ** 3);
    const mb = bytes / (1024 ** 2);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    if (mb >= 1) return `${mb.toFixed(0)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatTimeLeft(seconds) {
    if (seconds == null || seconds < 0) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return '< 1m';
}

function Insights() {
    const { data, history } = useContext(MetricsContext);

    if (!data) return null;

    const { health_score, suggestions, uptime, memory, swap, disk_partitions, sys_info, battery, processes, cpu } = data;

    const topCpu = useMemo(() => (processes || []).slice().sort((a, b) => (b.cpu_percent || 0) - (a.cpu_percent || 0)).slice(0, 5), [processes]);
    const topMem = useMemo(() => (processes || []).slice().sort((a, b) => (b.memory_percent || 0) - (a.memory_percent || 0)).slice(0, 5), [processes]);
    const coreCount = cpu?.core_count ?? 1;
    const loadAvg = Array.isArray(sys_info?.load_avg) && sys_info.load_avg.length >= 1 ? sys_info.load_avg[0] : null;
    const loadAboveCores = loadAvg != null && coreCount > 0 && loadAvg > coreCount;
    const currentTip = TIPS[Math.floor((Date.now() / 60000) % TIPS.length)];
    const healthHistory = history?.health || [];

    const formatUptime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    const bootTimeStr = sys_info?.boot_time ? new Date(sys_info.boot_time * 1000).toLocaleString() : '—';
    const loadAvgStr = Array.isArray(sys_info?.load_avg) && sys_info.load_avg.length >= 3
        ? `${sys_info.load_avg[0].toFixed(2)} / ${sys_info.load_avg[1].toFixed(2)} / ${sys_info.load_avg[2].toFixed(2)}`
        : '—';

    const getScoreColor = (score) => {
        if (score >= 80) return "text-green-500";
        if (score >= 50) return "text-yellow-500";
        return "text-red-500";
    };

    const getScoreCircleColor = (score) => {
        if (score >= 80) return "#22c55e"; // green-500
        if (score >= 50) return "#eab308"; // yellow-500
        return "#ef4444"; // red-500
    };

    return (
        <div className="flex flex-col gap-8 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Health Score Section */}
                <div className="glass-panel flex flex-col items-center justify-center p-8 relative overflow-hidden">
                    <h2 className="text-2xl font-bold text-slate-100 mb-8 z-10 flex items-center gap-3">
                        <ShieldCheck className={getScoreColor(health_score)} size={32} /> System Health Score
                    </h2>

                    {/* Custom SVG Gauge */}
                    <div className="relative w-64 h-64 z-10">
                        <svg className="w-full h-full transform -rotate-90">
                            {/* Background Circle */}
                            <circle
                                cx="50%" cy="50%" r="45%"
                                fill="transparent"
                                stroke="#1e293b"
                                strokeWidth="12"
                            />
                            {/* Progress Circle */}
                            <motion.circle
                                cx="50%" cy="50%" r="45%"
                                fill="transparent"
                                stroke={getScoreCircleColor(health_score)}
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray="283" // 2 * pi * 45 (approx 283)
                                initial={{ strokeDashoffset: 283 }}
                                animate={{ strokeDashoffset: 283 - (283 * health_score) / 100 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-6xl font-bold ${getScoreColor(health_score)}`}>{health_score}</span>
                            <span className="text-slate-500 text-sm mt-2">OUT OF 100</span>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full border border-slate-700 z-10">
                        <Clock size={16} className="text-blue-400" />
                        <span className="text-slate-400 text-sm font-mono">Uptime: {formatUptime(uptime)}</span>
                    </div>

                    {/* Health score trend sparkline */}
                    {healthHistory.length >= 2 && (
                        <div className="mt-6 w-full max-w-xs z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp size={14} className="text-slate-500" />
                                <span className="text-xs text-slate-500">Health trend (last {healthHistory.length} samples)</span>
                            </div>
                            <svg viewBox="0 0 200 36" className="w-full h-9 text-cyan-500/80" preserveAspectRatio="none">
                                <polyline
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    points={healthHistory.map((d, i) => {
                                        const x = (i / Math.max(1, healthHistory.length - 1)) * 200;
                                        const y = 32 - (d.score / 100) * 28;
                                        return `${x},${y}`;
                                    }).join(' ')}
                                />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Suggestions Advisor */}
                <div className="glass-panel p-8 flex flex-col bg-slate-800/30">
                    <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
                        <Info className="text-cyan-400" size={28} /> Smart Advisor
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {suggestions.length === 0 && (
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-4">
                                <CheckCircle className="text-green-400" size={24} />
                                <div>
                                    <h3 className="font-bold text-green-400">All Systems Nominal</h3>
                                    <p className="text-green-200/70 text-sm">No issues detected.</p>
                                </div>
                            </div>
                        )}

                        {suggestions.map((sugg, idx) => {
                            let colorClass = "bg-slate-700/50 border-slate-600";
                            let icon = <Info className="text-slate-400" />;

                            if (sugg.severity === 'critical') {
                                colorClass = "bg-red-500/10 border-red-500/20";
                                icon = <AlertTriangle className="text-red-400" size={24} />;
                            } else if (sugg.severity === 'warning') {
                                colorClass = "bg-yellow-500/10 border-yellow-500/20";
                                icon = <AlertTriangle className="text-yellow-400" size={24} />;
                            } else if (sugg.severity === 'success') {
                                colorClass = "bg-green-500/10 border-green-500/20";
                                icon = <CheckCircle className="text-green-400" size={24} />;
                            } else if (sugg.severity === 'info') {
                                colorClass = "bg-blue-500/10 border-blue-500/20";
                                icon = <Info className="text-blue-400" size={24} />;
                            }

                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`p-4 rounded-xl border ${colorClass} flex items-start gap-4`}
                                >
                                    <div className="mt-1">{icon}</div>
                                    <div>
                                        <h3 className="font-bold text-slate-200 capitalize">{sugg.severity}</h3>
                                        <p className="text-slate-400 text-sm">{sugg.message}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Quick insights row: Battery, Load vs Cores, Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {battery && (
                    <div className="glass-panel p-4 flex items-start gap-4">
                        <Battery className="text-green-400 shrink-0 mt-0.5" size={28} />
                        <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">Battery</div>
                            <div className="text-slate-200 font-medium">
                                {battery.power_plugged
                                    ? battery.percent >= 100 ? 'Fully charged' : 'Charging'
                                    : battery.secsleft != null ? `${formatTimeLeft(battery.secsleft)} left` : `${battery.percent?.toFixed(0)}%`}
                            </div>
                            {battery.percent < 30 && !battery.power_plugged && (
                                <div className="text-amber-400 text-xs mt-0.5">Consider plugging in soon.</div>
                            )}
                        </div>
                    </div>
                )}
                {loadAvg != null && (
                    <div className="glass-panel p-4 flex items-start gap-4">
                        <Activity className="text-blue-400 shrink-0 mt-0.5" size={28} />
                        <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">Load vs Cores</div>
                            <div className="text-slate-200 font-medium">
                                Load {loadAvg.toFixed(2)} on {coreCount} core{coreCount !== 1 ? 's' : ''}
                            </div>
                            {loadAboveCores && (
                                <div className="text-amber-400 text-xs mt-0.5">Load above core count—system may be busy.</div>
                            )}
                        </div>
                    </div>
                )}
                <div className="glass-panel p-4 flex items-start gap-4">
                    <Lightbulb className="text-amber-400 shrink-0 mt-0.5" size={28} />
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Did you know?</div>
                        <p className="text-slate-300 text-sm">{currentTip}</p>
                    </div>
                </div>
            </div>

            {/* Top resource hogs */}
            {(topCpu.length > 0 || topMem.length > 0) && (
                <div className="glass-panel p-6">
                    <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                        <Activity className="text-orange-400" /> Top Resource Hogs
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-slate-400 mb-2">Top CPU</h3>
                            <ul className="space-y-1.5">
                                {topCpu.map((p, i) => (
                                    <li key={`cpu-${p.pid}-${i}`} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-300 truncate max-w-[180px]" title={p.name}>{p.name}</span>
                                        <span className="font-mono text-cyan-400 shrink-0">{p.cpu_percent?.toFixed(1) ?? 0}%</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-slate-400 mb-2">Top Memory</h3>
                            <ul className="space-y-1.5">
                                {topMem.map((p, i) => (
                                    <li key={`mem-${p.pid}-${i}`} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-300 truncate max-w-[180px]" title={p.name}>{p.name}</span>
                                        <span className="font-mono text-purple-400 shrink-0">{p.memory_percent?.toFixed(1) ?? 0}%</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Memory breakdown */}
            {memory && (
                <div className="glass-panel p-6">
                    <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                        <MemoryStick className="text-purple-400" /> Memory Breakdown
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                            <div className="text-xs text-slate-500">Used</div>
                            <div className="text-lg font-bold text-slate-200">{formatBytes(memory.used)}</div>
                            <div className="text-xs text-slate-400">{memory.percent?.toFixed(1)}%</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                            <div className="text-xs text-slate-500">Available</div>
                            <div className="text-lg font-bold text-green-400">{formatBytes(memory.available)}</div>
                        </div>
                        {memory.cached != null && (
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                <div className="text-xs text-slate-500">Cached</div>
                                <div className="text-lg font-bold text-cyan-400">{formatBytes(memory.cached)}</div>
                            </div>
                        )}
                        {memory.buffers != null && (
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                <div className="text-xs text-slate-500">Buffers</div>
                                <div className="text-lg font-bold text-yellow-400">{formatBytes(memory.buffers)}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Swap */}
            {swap && (swap.total > 0 || swap.used > 0) && (
                <div className="glass-panel p-6">
                    <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                        <MemoryStick size={20} className="text-amber-400" /> Swap
                    </h2>
                    <div className="flex flex-wrap gap-6 items-center">
                        <div><span className="text-slate-500">Total:</span> <span className="font-mono text-slate-200">{formatBytes(swap.total)}</span></div>
                        <div><span className="text-slate-500">Used:</span> <span className="font-mono text-red-400">{formatBytes(swap.used)}</span></div>
                        <div><span className="text-slate-500">Free:</span> <span className="font-mono text-green-400">{formatBytes(swap.free)}</span></div>
                        <div><span className="text-slate-500">Usage:</span> <span className="font-mono text-slate-200">{swap.percent?.toFixed(1)}%</span></div>
                    </div>
                    {(swap.percent ?? 0) > 50 && (
                        <p className="mt-3 text-sm text-amber-400 flex items-center gap-2">
                            <AlertTriangle size={16} /> High swap usage—closing apps can free RAM and reduce slowdowns.
                        </p>
                    )}
                </div>
            )}

            {/* Disk partitions */}
            {disk_partitions && disk_partitions.length > 0 && (
                <div className="glass-panel p-6">
                    <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                        <HardDrive className="text-emerald-400" /> Disk Partitions
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-slate-500 border-b border-slate-700">
                                    <th className="p-2">Device</th>
                                    <th className="p-2">Mount</th>
                                    <th className="p-2">Type</th>
                                    <th className="p-2 text-right">Total</th>
                                    <th className="p-2 text-right">Used</th>
                                    <th className="p-2 text-right">Free</th>
                                    <th className="p-2 text-right">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {disk_partitions.map((part, idx) => {
                                    const pct = part.percent ?? 0;
                                    const rowAlert = pct >= 90 ? 'bg-red-500/10 border-l-4 border-red-500' : pct >= 80 ? 'bg-amber-500/10 border-l-4 border-amber-500' : '';
                                    return (
                                        <tr key={idx} className={`border-b border-slate-700/50 ${rowAlert}`}>
                                            <td className="p-2 font-mono text-slate-300">{part.device}</td>
                                            <td className="p-2 font-mono text-slate-400">{part.mountpoint}</td>
                                            <td className="p-2 text-slate-400">{part.fstype}</td>
                                            <td className="p-2 text-right font-mono text-slate-200">{formatBytes(part.total)}</td>
                                            <td className="p-2 text-right font-mono text-cyan-400">{formatBytes(part.used)}</td>
                                            <td className="p-2 text-right font-mono text-green-400">{formatBytes(part.free)}</td>
                                            <td className="p-2 text-right font-mono font-bold">
                                                {part.percent?.toFixed(0)}%
                                                {pct >= 90 && <span className="ml-1 text-red-400 text-xs">Critical</span>}
                                                {pct >= 80 && pct < 90 && <span className="ml-1 text-amber-400 text-xs">Warning</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Extended system info */}
            {sys_info && (
                <div className="glass-panel p-6">
                    <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                        <Cpu className="text-blue-400" /> System Info
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                            <div className="text-xs text-slate-500">OS</div>
                            <div className="text-slate-200 font-medium">{sys_info.os_info ?? '—'}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                            <div className="text-xs text-slate-500">Kernel / Version</div>
                            <div className="text-slate-200 font-medium text-xs break-all">{sys_info.kernel_version || '—'}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                            <div className="text-xs text-slate-500">Boot time</div>
                            <div className="text-slate-200 font-mono text-xs">{bootTimeStr}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                            <div className="text-xs text-slate-500">Load average (1 / 5 / 15 min)</div>
                            <div className="text-slate-200 font-mono">{loadAvgStr}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


export default Insights;