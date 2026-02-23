import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadialBarChart, RadialBar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Zap, ShieldCheck, HardDrive, Wifi, Cpu, Battery, MemoryStick, Activity, AlertTriangle, CheckCircle, Info, Thermometer, Flame, Gauge, Trophy, DollarSign, Leaf, Monitor, Heart, Shield, Plug } from 'lucide-react';

function formatTimeLeft(seconds) {
    if (seconds == null || seconds < 0) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return '< 1m';
}

function formatBytes(bytes) {
    if (bytes == null || bytes === 0) return '0 B';
    const gb = bytes / (1024 ** 3);
    const mb = bytes / (1024 ** 2);
    const kb = bytes / 1024;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(1)} KB`;
}

const TDP_ESTIMATES = {
    desktop: { idle: 50, full: 250 },
    laptop: { idle: 8, full: 65 },
    workstation: { idle: 80, full: 400 },
};

const ReportDocument = React.forwardRef(({ data, history, benchmarks, energySettings, powerProfiles, gpuInfo }, ref) => {
    if (!data) return null;

    const { sys_info, health_score, suggestions, uptime, cpu, battery, memory, cpu_cores, disk_io, net_io, processes } = data;
    const date = new Date().toLocaleString();
    const cpuTrend = (history?.cpu ?? []).slice(-24);
    const netTrend = (history?.net ?? []).slice(-24);
    const diskTrend = (history?.disk ?? []).slice(-24);

    // Full history for Historical Analysis page
    const cpuFullHistory = (history?.cpu ?? []).map((p) => ({ time: p.time, usage: p.usage != null ? Number(p.usage) : 0 }));
    const netFullHistory = (history?.net ?? []).map((p) => ({ time: p.time, sent: p.sent_rate != null ? (p.sent_rate / 1024) : 0, recv: p.recv_rate != null ? (p.recv_rate / 1024) : 0 }));
    const diskFullHistory = (history?.disk ?? []).map((p) => ({ time: p.time, read: p.read_rate != null ? (p.read_rate / 1024) : 0, write: p.write_rate != null ? (p.write_rate / 1024) : 0 }));

    const cpuChartData = cpuTrend.map((p) => ({ time: p.time, usage: p.usage != null ? Number(p.usage) : 0 }));
    const netChartData = netTrend.map((p) => ({
        time: p.time,
        sent: p.sent_rate != null ? (p.sent_rate / 1024) : 0,
        recv: p.recv_rate != null ? (p.recv_rate / 1024) : 0
    }));
    const diskChartData = diskTrend.map((p) => ({
        time: p.time,
        read: p.read_rate != null ? (p.read_rate / 1024) : 0,
        write: p.write_rate != null ? (p.write_rate / 1024) : 0
    }));

    const healthColor = health_score >= 80 ? '#059669' : health_score >= 50 ? '#d97706' : '#dc2626';
    const radialData = [
        { name: '_bg', value: 100, fill: '#e2e8f0' },
        { name: 'Health', value: Math.min(100, Math.max(0, health_score)), fill: healthColor }
    ];
    const topProcessesChart = (processes || []).slice(0, 10).map((p) => ({ name: (p.name || '').replace(/\.[^.]+$/, '') || '?', cpu: Number(p.cpu_percent) || 0 }));

    const peakCpu = cpuTrend.length > 0 ? Math.max(...cpuTrend.map(p => Number(p.usage || 0))) : (cpu?.usage_percent != null ? Number(cpu.usage_percent) : 0);
    const topProcess = (processes || []).slice().sort((a, b) => (Number(b.cpu_percent) || 0) - (Number(a.cpu_percent) || 0))[0];
    const topProcessName = topProcess ? (topProcess.name || '').replace(/\.[^.]+$/, '') : '—';

    const criticalAlerts = (suggestions || []).filter(s => s.severity === 'critical').length;

    // Thermal Data
    const thermal = data.thermal || { sensors: [], max_temp: 0, avg_temp: 0 };
    const thermalTrend = (history?.thermal || []).slice(-24);
    const hottestSensors = [...thermal.sensors].sort((a, b) => b.current - a.current).slice(0, 5);

    // Benchmark Data
    const latestBenchmark = benchmarks && benchmarks.length > 0 ? benchmarks[0] : null;
    const benchmarkScores = latestBenchmark ? [
        { name: 'CPU', score: latestBenchmark.cpu, fill: '#06b6d4' },
        { name: 'Memory', score: latestBenchmark.memory, fill: '#a855f7' },
        { name: 'Compute', score: latestBenchmark.compute, fill: '#eab308' },
        { name: 'Render', score: latestBenchmark.rendering, fill: '#22c55e' },
        { name: 'Multi', score: latestBenchmark.multitask, fill: '#ec4899' },
    ] : [];

    return (
        <div ref={ref} className="report-document w-full min-h-screen text-slate-900 p-8 print:p-6 font-sans text-sm relative" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 50%, #fff 100%)' }}>
            {/* ========== HEADER ========== */}
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 text-white p-8 mb-6 print:mb-4 shadow-xl print:shadow-none">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 15% 30%, #06b6d4 0%, transparent 45%), radial-gradient(circle at 85% 70%, #6366f1 0%, transparent 40%)' }} />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 opacity-80" />
                <div className="absolute top-4 right-4 w-32 h-32 rounded-full border border-white/10 opacity-50" />
                <div className="absolute bottom-4 left-8 w-16 h-16 rounded-full border border-white/10 opacity-30" />
                <div className="relative flex justify-between items-start flex-wrap gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 shadow-inner">
                            <Zap size={36} className="text-cyan-300 drop-shadow" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-md leading-tight">Operating Systems Power Consumption Analyzer</h1>
                            <p className="text-cyan-200/95 text-sm mt-2 font-medium">System Health & Resource Report</p>
                        </div>
                    </div>
                    <div className="text-right bg-white/15 rounded-xl px-5 py-4 border border-white/25 shadow-inner">
                        <p className="font-mono text-base font-semibold text-white">{date}</p>
                        <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-wider">Snapshot</p>
                    </div>
                </div>
            </header>

            {/* ========== AT A GLANCE ========== */}
            <div className="mt-8 print:mt-8 flex flex-wrap gap-3 mb-8 print:mb-6">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: healthColor }} />
                    <span className="text-xs text-slate-500 font-medium">Health</span>
                    <span className="text-lg font-bold text-slate-800" style={{ color: healthColor }}>{health_score}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 shadow-sm">
                    <Cpu size={16} className="text-blue-500" />
                    <span className="text-xs text-slate-500 font-medium">CPU</span>
                    <span className="text-lg font-bold text-slate-800">{cpu?.usage_percent != null ? `${Number(cpu.usage_percent).toFixed(1)}%` : '—'}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 shadow-sm">
                    <MemoryStick size={16} className="text-purple-500" />
                    <span className="text-xs text-slate-500 font-medium">Memory</span>
                    <span className="text-lg font-bold text-slate-800">{memory?.percent != null ? `${Number(memory.percent).toFixed(1)}%` : '—'}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 shadow-sm">
                    <Battery size={16} className="text-emerald-500" />
                    <span className="text-xs text-slate-500 font-medium">Battery</span>
                    <span className="text-lg font-bold text-slate-800">{battery?.percent != null ? `${Number(battery.percent).toFixed(1)}%` : '—'}</span>
                </div>
            </div>

            {/* ========== EXECUTIVE SUMMARY (first page) ========== */}
            <section
                className="mb-10 print:mb-8 bg-gradient-to-r from-indigo-50 via-white to-slate-50 border border-slate-100 rounded-2xl p-6 shadow-md print:break-inside-avoid overflow-hidden"
                style={{ minHeight: '6.5rem', pageBreakInside: 'avoid', overflow: 'hidden' }}
            >
                <div className="flex items-start justify-between">
                    <h2 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-indigo-500 rounded-sm inline-block" /> Executive Summary
                    </h2>
                    <div className="text-xs text-slate-500 pr-6">Snapshot overview</div>
                </div>

                <div className="mt-1 text-xs text-slate-700 leading-snug grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3 px-6 py-3 h-full">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white shadow-sm">
                            <Cpu size={16} />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Peak CPU (24h)</div>
                            <div className="font-semibold text-slate-800">{peakCpu != null ? `${Number(peakCpu).toFixed(1)}%` : '—'}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-6 py-3 h-full">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-sm">
                            <Activity size={16} />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Top Process (CPU)</div>
                            <div className="font-semibold text-slate-800 truncate" title={topProcessName}>{topProcessName}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-6 py-3 h-full">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white shadow-sm">
                            <AlertTriangle size={16} />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Critical Alerts</div>
                            <div className="font-semibold text-slate-800">{criticalAlerts}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== TOP 10 PROCESSES BAR CHART (page 2) ========== */}
            {topProcessesChart.length > 0 && (
                <section className="mt-6 mb-6 print:break-inside-avoid">
                    <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3 pl-4 border-l-4 border-indigo-500">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600"><Activity size={18} /></span>
                        Top 10 Processes by CPU Usage
                    </h2>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md overflow-hidden">
                        <BarChart width={885} height={275} data={topProcessesChart} layout="vertical" margin={{ top: 5, right: 20, left: 70, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                            <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 9 }} stroke="#64748b" />
                            <YAxis type="category" dataKey="name" width={65} tick={{ fontSize: 9 }} stroke="#64748b" />
                            <Bar dataKey="cpu" fill="#6366f1" radius={[0, 4, 4, 0]} isAnimationActive={false} />
                        </BarChart>
                    </div>
                </section>
            )}

            {/* ========== SYSTEM SPECIFICATIONS ========== */}
            <section className="mb-8 print:break-inside-avoid">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 pl-4 border-l-4 border-cyan-500">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600"><Activity size={18} /></span>
                    System Specifications
                </h2>
                <div className="grid grid-cols-3 gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
                    <div className="relative p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 rounded-r" />
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">OS / Platform</span>
                        <span className="font-semibold text-slate-800">{sys_info?.os_info ?? 'Unknown'}</span>
                    </div>
                    <div className="relative p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400 rounded-r" />
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Processor</span>
                        <span className="font-semibold text-slate-800 text-xs leading-tight">{sys_info?.cpu_model ?? 'Unknown CPU'}</span>
                    </div>
                    <div className="relative p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                        <div className="absolute top-0 left-0 w-1 h-full bg-violet-400 rounded-r" />
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Total RAM</span>
                        <span className="font-semibold text-slate-800">{sys_info?.ram_total_gb ?? 0} GB</span>
                    </div>
                </div>
            </section>

            {/* ========== HEALTH SCORE & DIAGNOSTICS ========== */}
            <section className="mt-10 pt-2 mb-8 flex flex-wrap gap-6 print:mt-10 print:pt-2 print:break-inside-avoid">
                <div className="flex-shrink-0">
                    <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 pl-4 border-l-4 border-emerald-500">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600"><ShieldCheck size={18} /></span>
                        Health Score
                    </h2>
                    <div className="relative w-40 h-40 p-2 bg-white rounded-2xl border border-slate-200 shadow-md">
                        <RadialBarChart width={144} height={144} innerRadius="72%" outerRadius="98%" data={radialData} startAngle={90} endAngle={-270}>
                            <RadialBar dataKey="value" cornerRadius={10} />
                        </RadialBarChart>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-2">
                            <span className="text-4xl font-bold" style={{ color: healthColor }}>{health_score}</span>
                            <span className="text-[10px] text-slate-500 font-medium mt-0.5">out of 100</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 min-w-[280px]">
                    <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 pl-4 border-l-4 border-amber-500">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-600"><AlertTriangle size={18} /></span>
                        Diagnostics
                    </h2>
                    <ul className="space-y-2">
                        {(suggestions || []).map((sugg, idx) => {
                            const isCritical = sugg.severity === 'critical';
                            const isSuccess = sugg.severity === 'success';
                            const bg = isCritical ? 'bg-red-50 border-red-200' : isSuccess ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200';
                            const icon = isCritical ? <AlertTriangle size={14} className="text-red-600 shrink-0" /> : isSuccess ? <CheckCircle size={14} className="text-emerald-600 shrink-0" /> : <Info size={14} className="text-amber-600 shrink-0" />;
                            return (
                                <li key={idx} className={`p-3 rounded-lg border flex gap-3 items-start text-xs ${bg}`}>
                                    {icon}
                                    <span className={isCritical ? 'text-red-800 font-medium' : isSuccess ? 'text-emerald-800' : 'text-amber-800'}>{sugg.message}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </section>

            {/* ========== RESOURCE SNAPSHOT (Current Metrics) ========== */}
            <section className="mb-8 print:break-inside-avoid">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 pl-4 border-l-4 border-blue-500">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600"><Cpu size={18} /></span>
                    Current Resource Snapshot
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="relative overflow-hidden p-5 bg-white border border-slate-200 rounded-2xl shadow-md">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                        <div className="flex items-center gap-2 mb-2">
                            <Cpu size={20} className="text-blue-500" />
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">CPU Usage</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-800">{cpu?.usage_percent != null ? `${Number(cpu.usage_percent).toFixed(1)}%` : '—'}</div>
                        <div className="h-2.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all" style={{ width: `${Math.min(100, cpu?.usage_percent ?? 0)}%` }} />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1.5">{cpu?.frequency_current != null ? `${Number(cpu.frequency_current).toFixed(0)} MHz` : ''}</div>
                    </div>
                    <div className="relative overflow-hidden p-5 bg-white border border-slate-200 rounded-2xl shadow-md">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-violet-500" />
                        <div className="flex items-center gap-2 mb-2">
                            <MemoryStick size={20} className="text-purple-500" />
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Memory</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-800">{memory?.percent != null ? `${Number(memory.percent).toFixed(1)}%` : '—'}</div>
                        <div className="h-2.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" style={{ width: `${Math.min(100, memory?.percent ?? 0)}%` }} />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1.5 truncate">{memory != null ? `${formatBytes(memory.used)} / ${formatBytes(memory.total)}` : ''}</div>
                    </div>
                    <div className="relative overflow-hidden p-5 bg-white border border-slate-200 rounded-2xl shadow-md">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
                        <div className="flex items-center gap-2 mb-2">
                            <Battery size={20} className="text-emerald-500" />
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Battery</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-800">{battery?.percent != null ? `${Number(battery.percent).toFixed(1)}%` : '—'}</div>
                        <div className="h-2.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full" style={{ width: `${Math.min(100, battery?.percent ?? 0)}%` }} />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1.5">{battery?.power_plugged ? 'Charging' : battery?.secsleft != null ? formatTimeLeft(battery.secsleft) + ' left' : battery?.status ?? ''}</div>
                    </div>
                    <div className="relative overflow-hidden p-5 bg-white border border-slate-200 rounded-2xl shadow-md">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500" />
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={20} className="text-cyan-500" />
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Uptime</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-800">{uptime != null ? `${(uptime / 3600).toFixed(1)} h` : '—'}</div>
                        <div className="text-[10px] text-slate-500 mt-2">Processes: {Array.isArray(processes) ? processes.length : 0}</div>
                    </div>
                </div>
            </section>

            {/* ========== CPU CORES BREAKDOWN ========== */}
            {Array.isArray(cpu_cores) && cpu_cores.length > 0 && (
                <section className="mb-8 print:break-inside-avoid">
                    <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 pl-4 border-l-4 border-indigo-500">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600"><Cpu size={18} /></span>
                        CPU Core Breakdown
                    </h2>
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-md">
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                            {cpu_cores.map((pct, idx) => (
                                <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                                    <div className="text-[10px] text-slate-500 font-medium">Core {idx}</div>
                                    <div className="text-sm font-bold text-slate-800">{Number(pct).toFixed(0)}%</div>
                                    <div className="w-full h-2 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                                            style={{ width: `${Math.min(100, pct)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ========== I/O SNAPSHOT (Network & Disk) ========== */}
            <section className="mb-8 print:break-inside-avoid">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 pl-4 border-l-4 border-violet-500">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50 text-violet-600"><Wifi size={18} /></span>
                    I/O Snapshot
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-md">
                        <div className="flex items-center gap-2 mb-3 text-slate-700 font-semibold">
                            <Wifi size={18} className="text-violet-500" /> Network
                        </div>
                        <table className="w-full text-xs">
                            <tbody>
                                <tr className="border-b border-slate-100"><td className="py-2 text-slate-500">Sent</td><td className="text-right font-mono font-medium">{net_io != null ? formatBytes(net_io.bytes_sent) : '—'}</td></tr>
                                <tr><td className="py-2 text-slate-500">Received</td><td className="text-right font-mono font-medium">{net_io != null ? formatBytes(net_io.bytes_recv) : '—'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-md">
                        <div className="flex items-center gap-2 mb-3 text-slate-700 font-semibold">
                            <HardDrive size={18} className="text-amber-500" /> Disk
                        </div>
                        <table className="w-full text-xs">
                            <tbody>
                                <tr className="border-b border-slate-100"><td className="py-2 text-slate-500">Read</td><td className="text-right font-mono font-medium">{disk_io != null ? formatBytes(disk_io.read_bytes) : '—'}</td></tr>
                                <tr><td className="py-2 text-slate-500">Written</td><td className="text-right font-mono font-medium">{disk_io != null ? formatBytes(disk_io.write_bytes) : '—'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ========== RECENT CPU TREND (Table) ========== */}
            {cpuTrend.length > 0 && (
                <section className="mt-10 pt-3 mb-8 print:mt-10 print:pt-3 print:break-inside-avoid">
                    <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 pl-4 border-l-4 border-slate-400">Recent CPU Usage (Table)</h2>
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600">
                                    <th className="p-3 text-left font-semibold">Time</th>
                                    <th className="p-3 text-right font-semibold">CPU %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cpuTrend.map((point, idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                                        <td className="p-3">{point.time ?? '—'}</td>
                                        <td className="p-3 text-right font-mono font-medium">{point.usage != null ? Number(point.usage).toFixed(1) : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* ========== RECENT NETWORK & DISK (Tables) ========== */}
            {(netTrend.length > 0 || diskTrend.length > 0) && (
                <section className="mt-10 pt-3 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 print:mt-10 print:pt-3 print:break-inside-avoid">
                    {netTrend.length > 0 && (
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 pl-4 border-l-4 border-violet-500">Recent Network (KB/s)</h2>
                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-600">
                                            <th className="p-3 text-left font-semibold">Time</th>
                                            <th className="p-3 text-right font-semibold">Sent</th>
                                            <th className="p-3 text-right font-semibold">Recv</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {netTrend.map((point, idx) => (
                                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                                                <td className="p-3">{point.time ?? '—'}</td>
                                                <td className="p-3 text-right font-mono">{point.sent_rate != null ? (point.sent_rate / 1024).toFixed(1) : '—'}</td>
                                                <td className="p-3 text-right font-mono">{point.recv_rate != null ? (point.recv_rate / 1024).toFixed(1) : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {diskTrend.length > 0 && (
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 pl-4 border-l-4 border-amber-500">Recent Disk I/O (KB/s)</h2>
                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-600">
                                            <th className="p-3 text-left font-semibold">Time</th>
                                            <th className="p-3 text-right font-semibold">Read</th>
                                            <th className="p-3 text-right font-semibold">Write</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {diskTrend.map((point, idx) => (
                                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                                                <td className="p-3">{point.time ?? '—'}</td>
                                                <td className="p-3 text-right font-mono">{point.read_rate != null ? (point.read_rate / 1024).toFixed(1) : '—'}</td>
                                                <td className="p-3 text-right font-mono">{point.write_rate != null ? (point.write_rate / 1024).toFixed(1) : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* ========== HIGH IMPACT PROCESSES ========== */}
            <section className="mb-8 pt-2 print:break-inside-avoid">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 pl-4 border-l-4 border-rose-500 mt-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-600"><Activity size={18} /></span>
                    High Impact Processes (Top 20)
                </h2>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-100 text-slate-600">
                                <th className="p-3 text-left font-semibold">Name</th>
                                <th className="p-3 text-right font-semibold">PID</th>
                                <th className="p-3 text-right font-semibold">CPU %</th>
                                <th className="p-3 text-right font-semibold">RAM %</th>
                                <th className="p-3 text-right font-semibold">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(processes || []).slice(0, 20).map((proc, idx) => (
                                <tr key={proc.pid} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                                    <td className="p-3 font-medium truncate max-w-[140px]" title={proc.name}>{proc.name}</td>
                                    <td className="p-3 text-right font-mono text-slate-500">{proc.pid}</td>
                                    <td className="p-3 text-right font-medium">{proc.cpu_percent != null ? Number(proc.cpu_percent).toFixed(1) : '—'}</td>
                                    <td className="p-3 text-right font-medium">{proc.memory_percent != null ? Number(proc.memory_percent).toFixed(1) : '—'}</td>
                                    <td className="p-3 text-right">
                                        {proc.power_score != null ? (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${Number(proc.power_score) >= 80 ? 'bg-emerald-100 text-emerald-800' : Number(proc.power_score) >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                                {Number(proc.power_score).toFixed(1)}
                                            </span>
                                        ) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ========== THERMAL ANALYSIS ========== */}
            <section className="mb-8 pt-2 print:break-inside-avoid" style={{ breakBefore: 'page', pageBreakBefore: 'always' }}>
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 pl-4 border-l-4 border-orange-500 mt-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600"><Thermometer size={18} /></span>
                    Thermal Analysis
                </h2>

                {/* Thermal Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <div className="relative overflow-hidden p-4 bg-white border border-slate-200 rounded-2xl shadow-md">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Max Temperature</div>
                        <div className="text-2xl font-bold" style={{ color: thermal.max_temp >= 85 ? '#ef4444' : thermal.max_temp >= 65 ? '#f97316' : '#06b6d4' }}>{thermal.max_temp}°C</div>
                        <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (thermal.max_temp / 100) * 100)}%`, background: thermal.max_temp >= 85 ? '#ef4444' : thermal.max_temp >= 65 ? '#f97316' : '#06b6d4' }} />
                        </div>
                    </div>
                    <div className="relative overflow-hidden p-4 bg-white border border-slate-200 rounded-2xl shadow-md">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Avg Temperature</div>
                        <div className="text-2xl font-bold" style={{ color: thermal.avg_temp >= 85 ? '#ef4444' : thermal.avg_temp >= 65 ? '#f97316' : '#06b6d4' }}>{thermal.avg_temp}°C</div>
                        <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (thermal.avg_temp / 100) * 100)}%`, background: thermal.avg_temp >= 85 ? '#ef4444' : thermal.avg_temp >= 65 ? '#f97316' : '#06b6d4' }} />
                        </div>
                    </div>
                    <div className="relative overflow-hidden p-4 bg-white border border-slate-200 rounded-2xl shadow-md">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Active Sensors</div>
                        <div className="text-2xl font-bold text-indigo-600">{thermal.sensors.length}</div>
                        <div className="text-[10px] text-slate-400 mt-2">Temperature probes</div>
                    </div>
                    <div className="relative overflow-hidden p-4 bg-white border border-slate-200 rounded-2xl shadow-md">
                        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: thermal.is_throttling ? 'linear-gradient(to right, #ef4444, #dc2626)' : 'linear-gradient(to right, #22c55e, #16a34a)' }} />
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Throttling Status</div>
                        <div className="text-lg font-bold" style={{ color: thermal.is_throttling ? '#ef4444' : '#22c55e' }}>
                            {thermal.is_throttling ? '⚠ Active' : '✓ Normal'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-2">{thermal.is_throttling ? 'Performance limited' : 'No throttling detected'}</div>
                    </div>
                </div>

                {/* Temperature Trend Chart */}
                {thermalTrend.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md overflow-hidden mb-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                            <Activity size={16} className="text-orange-500" /> Temperature Trend (Recent Session)
                        </h3>
                        <AreaChart width={885} height={200} data={thermalTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="thermalMaxGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="thermalAvgGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 9 }} interval="preserveStartEnd" minTickGap={40} />
                            <YAxis stroke="#64748b" tick={{ fontSize: 9 }} domain={[20, 110]} width={28} />
                            <Tooltip contentStyle={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', fontSize: '11px' }} />
                            <Area type="monotone" dataKey="max" name="Max °C" stroke="#f97316" fill="url(#thermalMaxGrad)" strokeWidth={2} isAnimationActive={false} />
                            <Area type="monotone" dataKey="avg" name="Avg °C" stroke="#06b6d4" fill="url(#thermalAvgGrad)" strokeWidth={2} isAnimationActive={false} />
                        </AreaChart>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    {/* Hottest Sensors Chart */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md overflow-hidden">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5"><Flame size={16} className="text-red-500" /> Hottest Sensors (°C)</h3>
                        <BarChart width={400} height={200} layout="vertical" data={hottestSensors} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" domain={[0, 110]} hide />
                            <YAxis dataKey="label" type="category" width={100} tick={{ fontSize: 9, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', fontSize: '11px' }} formatter={(v) => [`${v}°C`, 'Temperature']} />
                            <Bar isAnimationActive={false} dataKey="current" radius={[0, 4, 4, 0]} barSize={15}>
                                {hottestSensors.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.current > 85 ? '#ef4444' : entry.current > 65 ? '#f97316' : entry.current > 45 ? '#06b6d4' : '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </div>

                    {/* Sensor Distribution */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md overflow-hidden">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5"><Thermometer size={16} className="text-orange-500" /> Sensor Distribution</h3>
                        <div className="flex items-center justify-center">
                            <PieChart width={400} height={220}>
                                <Pie isAnimationActive={false}
                                    data={[
                                        { name: 'Cool (<45°C)', value: thermal.sensors.filter(s => s.current < 45).length, color: '#3b82f6' },
                                        { name: 'Normal (45-65°C)', value: thermal.sensors.filter(s => s.current >= 45 && s.current < 65).length, color: '#06b6d4' },
                                        { name: 'Warm (65-85°C)', value: thermal.sensors.filter(s => s.current >= 65 && s.current < 85).length, color: '#eab308' },
                                        { name: 'Hot (>85°C)', value: thermal.sensors.filter(s => s.current >= 85).length, color: '#ef4444' },
                                    ].filter(d => d.value > 0)}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                >
                                    {[
                                        { name: 'Cool (<45°C)', value: thermal.sensors.filter(s => s.current < 45).length, color: '#3b82f6' },
                                        { name: 'Normal (45-65°C)', value: thermal.sensors.filter(s => s.current >= 45 && s.current < 65).length, color: '#06b6d4' },
                                        { name: 'Warm (65-85°C)', value: thermal.sensors.filter(s => s.current >= 65 && s.current < 85).length, color: '#eab308' },
                                        { name: 'Hot (>85°C)', value: thermal.sensors.filter(s => s.current >= 85).length, color: '#ef4444' },
                                    ].filter(d => d.value > 0).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                            </PieChart>
                        </div>
                    </div>
                </div>

                {/* Full Sensor Details Table */}
                {thermal.sensors.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md mt-14 mb-10" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                        <div className="px-5 py-3 mb-4 bg-gradient-to-r from-orange-50 to-white border-b border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Cpu size={16} className="text-orange-500" /> Complete Sensor Details</h3>
                        </div>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-50 text-slate-600">
                                    <th className="p-3 text-left font-semibold">Sensor</th>
                                    <th className="p-3 text-left font-semibold">Chip</th>
                                    <th className="p-3 text-right font-semibold">Current (°C)</th>
                                    <th className="p-3 text-right font-semibold">High (°C)</th>
                                    <th className="p-3 text-right font-semibold">Critical (°C)</th>
                                    <th className="p-3 text-center font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {thermal.sensors.map((sensor, idx) => {
                                    const statusColor = sensor.current >= (sensor.critical || 100) ? '#ef4444' : sensor.current >= (sensor.high || 85) ? '#f97316' : sensor.current >= 65 ? '#eab308' : '#22c55e';
                                    const statusText = sensor.current >= (sensor.critical || 100) ? 'CRITICAL' : sensor.current >= (sensor.high || 85) ? 'HIGH' : sensor.current >= 65 ? 'WARM' : 'NORMAL';
                                    return (
                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                                            <td className="p-3 font-medium text-slate-800">{sensor.label}</td>
                                            <td className="p-3 text-slate-500">{sensor.chip}</td>
                                            <td className="p-3 text-right font-mono font-bold" style={{ color: statusColor }}>{sensor.current}°</td>
                                            <td className="p-3 text-right font-mono text-slate-500">{sensor.high || '—'}</td>
                                            <td className="p-3 text-right font-mono text-slate-500">{sensor.critical || '—'}</td>
                                            <td className="p-3 text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: statusColor + '18', color: statusColor }}>
                                                    {statusText}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Thermal Risk Assessment */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md mt-4" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5"><AlertTriangle size={16} className="text-amber-500" /> Thermal Risk Assessment</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border" style={{ borderColor: thermal.max_temp >= 85 ? '#fca5a5' : thermal.max_temp >= 65 ? '#fed7aa' : '#bbf7d0', backgroundColor: thermal.max_temp >= 85 ? '#fef2f2' : thermal.max_temp >= 65 ? '#fffbeb' : '#f0fdf4' }}>
                            <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: thermal.max_temp >= 85 ? '#dc2626' : thermal.max_temp >= 65 ? '#d97706' : '#16a34a' }}>Overall Risk</div>
                            <div className="text-lg font-bold" style={{ color: thermal.max_temp >= 85 ? '#dc2626' : thermal.max_temp >= 65 ? '#d97706' : '#16a34a' }}>
                                {thermal.max_temp >= 85 ? 'High Risk' : thermal.max_temp >= 65 ? 'Moderate' : 'Low Risk'}
                            </div>
                            <div className="text-xs mt-1 text-slate-600">
                                {thermal.max_temp >= 85 ? 'Temperatures exceeding safe limits. Check cooling.' : thermal.max_temp >= 65 ? 'Temperatures elevated. Monitor workload.' : 'Temperatures within safe operating range.'}
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Thermal Headroom</div>
                            <div className="text-lg font-bold text-slate-800">{Math.max(0, 85 - thermal.max_temp).toFixed(1)}°C</div>
                            <div className="text-xs text-slate-500 mt-1">Before reaching high threshold</div>
                            <div className="h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, ((85 - thermal.max_temp) / 85) * 100))}%`, background: (85 - thermal.max_temp) > 20 ? '#22c55e' : (85 - thermal.max_temp) > 5 ? '#eab308' : '#ef4444' }} />
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Temperature Spread</div>
                            <div className="text-lg font-bold text-slate-800">{thermal.sensors.length > 0 ? (thermal.max_temp - Math.min(...thermal.sensors.map(s => s.current))).toFixed(1) : 0}°C</div>
                            <div className="text-xs text-slate-500 mt-1">Difference between hottest and coolest sensor</div>
                            <div className="flex gap-1 mt-2">
                                {['#3b82f6', '#06b6d4', '#eab308', '#f97316', '#ef4444'].map((c, i) => (
                                    <div key={i} className="flex-1 h-2 rounded-full" style={{ backgroundColor: c, opacity: i <= Math.floor((thermal.max_temp / 100) * 4) ? 1 : 0.2 }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== BENCHMARK PERFORMANCE ========== */}
            {
                latestBenchmark && (
                    <section className="mb-8 pt-2 print:break-inside-avoid" style={{ breakBefore: 'page', pageBreakBefore: 'always' }}>
                        <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 pl-4 border-l-4 border-yellow-500 mt-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600"><Trophy size={18} /></span>
                            Benchmark Performance
                        </h2>

                        {/* Overall Score + Category Bar Chart (existing, kept) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                            {/* Overall Score Ring */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md flex flex-col items-center justify-center col-span-1">
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Overall Score</span>
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                                        <circle cx="64" cy="64" r="56" fill="none" stroke={latestBenchmark.overall >= 90 ? '#22c55e' : latestBenchmark.overall >= 70 ? '#eab308' : '#ef4444'} strokeWidth="12" strokeDasharray={`${latestBenchmark.overall * 3.51} 351`} strokeLinecap="round" />
                                    </svg>
                                    <span className="absolute text-3xl font-bold text-slate-800">{latestBenchmark.overall}</span>
                                </div>
                                <span className="mt-2 text-xs font-medium px-3 py-1 rounded-full" style={{
                                    backgroundColor: latestBenchmark.overall >= 90 ? '#dcfce7' : latestBenchmark.overall >= 70 ? '#fef9c3' : '#fee2e2',
                                    color: latestBenchmark.overall >= 90 ? '#166534' : latestBenchmark.overall >= 70 ? '#854d0e' : '#991b1b'
                                }}>
                                    {latestBenchmark.overall >= 90 ? '★ Excellent' : latestBenchmark.overall >= 80 ? '● Very Good' : latestBenchmark.overall >= 70 ? '● Good' : latestBenchmark.overall >= 50 ? '○ Average' : '✕ Below Average'}
                                </span>
                                {latestBenchmark.duration && (
                                    <div className="text-[10px] text-slate-400 mt-2">Completed in {latestBenchmark.duration}s</div>
                                )}
                            </div>

                            {/* Category Scores Bar Chart */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md col-span-2">
                                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5"><Gauge size={16} className="text-cyan-500" /> Category Scores</h3>
                                <BarChart width={560} height={160} data={benchmarkScores} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', fontSize: '11px' }} formatter={(v) => [`${v}/100`, 'Score']} />
                                    <Bar isAnimationActive={false} dataKey="score" radius={[0, 4, 4, 0]} barSize={18}>
                                        {benchmarkScores.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </div>
                        </div>

                        {/* Individual Category Detail Cards */}
                        <div className="grid grid-cols-5 gap-3 mb-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                            {[
                                { key: 'cpu', label: 'CPU', icon: <Cpu size={14} />, color: '#06b6d4', bg: '#ecfeff', score: latestBenchmark.cpu, desc: 'Prime calculation' },
                                { key: 'memory', label: 'Memory', icon: <Activity size={14} />, color: '#a855f7', bg: '#faf5ff', score: latestBenchmark.memory, desc: 'Array operations' },
                                { key: 'compute', label: 'Compute', icon: <Zap size={14} />, color: '#eab308', bg: '#fefce8', score: latestBenchmark.compute, desc: 'Math operations' },
                                { key: 'rendering', label: 'Render', icon: <Activity size={14} />, color: '#22c55e', bg: '#f0fdf4', score: latestBenchmark.rendering, desc: 'Canvas drawing' },
                                { key: 'multitask', label: 'Multi', icon: <Activity size={14} />, color: '#ec4899', bg: '#fdf2f8', score: latestBenchmark.multitask, desc: 'Concurrent ops' },
                            ].map((cat) => (
                                <div key={cat.key} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-center" style={{ borderTop: `3px solid ${cat.color}` }}>
                                    <div className="flex items-center justify-center gap-1 mb-1" style={{ color: cat.color }}>
                                        {cat.icon}
                                        <span className="text-[10px] font-semibold uppercase tracking-wide">{cat.label}</span>
                                    </div>
                                    <div className="text-xl font-bold text-slate-800">{cat.score || '—'}</div>
                                    <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${cat.score || 0}%`, backgroundColor: cat.color }} />
                                    </div>
                                    <div className="text-[9px] text-slate-400 mt-1.5">{cat.desc}</div>
                                </div>
                            ))}
                        </div>

                        {/* Benchmark Scoring Breakdown Table */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md mb-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                            <div className="px-5 py-3 bg-gradient-to-r from-yellow-50 to-white border-b border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Activity size={16} className="text-yellow-600" /> Detailed Score Breakdown</h3>
                            </div>
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-600">
                                        <th className="p-3 text-left font-semibold">Category</th>
                                        <th className="p-3 text-center font-semibold">Score</th>
                                        <th className="p-3 text-center font-semibold">Rating</th>
                                        <th className="p-3 text-left font-semibold">Visual</th>
                                        <th className="p-3 text-left font-semibold">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { name: 'CPU Performance', score: latestBenchmark.cpu, color: '#06b6d4', desc: 'Prime number calculation stress test measuring single-thread throughput' },
                                        { name: 'Memory Speed', score: latestBenchmark.memory, color: '#a855f7', desc: 'Array allocation, sorting, and random access bandwidth test' },
                                        { name: 'Compute Power', score: latestBenchmark.compute, color: '#eab308', desc: 'Floating-point trigonometry and logarithmic math operations' },
                                        { name: 'Rendering', score: latestBenchmark.rendering, color: '#22c55e', desc: 'Canvas 2D drawing, gradient fills, and frame rate measurement' },
                                        { name: 'Multi-Task', score: latestBenchmark.multitask, color: '#ec4899', desc: 'Concurrent Promise resolution and parallel workload handling' },
                                        { name: 'Overall', score: latestBenchmark.overall, color: '#334155', desc: 'Weighted average across all benchmark categories' },
                                    ].map((cat, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'} style={idx === 5 ? { borderTop: '2px solid #e2e8f0', fontWeight: 'bold' } : {}}>
                                            <td className="p-3 font-medium text-slate-800">{cat.name}</td>
                                            <td className="p-3 text-center">
                                                <span className="font-mono font-bold text-sm" style={{ color: cat.color }}>{cat.score || '—'}</span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" style={{
                                                    backgroundColor: ((cat.score || 0) >= 90 ? '#dcfce7' : (cat.score || 0) >= 70 ? '#fef9c3' : '#fee2e2'),
                                                    color: ((cat.score || 0) >= 90 ? '#166534' : (cat.score || 0) >= 70 ? '#854d0e' : '#991b1b'),
                                                }}>
                                                    {(cat.score || 0) >= 90 ? 'Excellent' : (cat.score || 0) >= 80 ? 'Very Good' : (cat.score || 0) >= 70 ? 'Good' : (cat.score || 0) >= 50 ? 'Average' : 'Low'}
                                                </span>
                                            </td>
                                            <td className="p-3" style={{ minWidth: '120px' }}>
                                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${cat.score || 0}%`, backgroundColor: cat.color }} />
                                                </div>
                                            </td>
                                            <td className="p-3 text-slate-500 text-[10px] leading-tight" style={{ maxWidth: '200px' }}>{cat.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Benchmark History + Performance Tips */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                            {/* Run History */}
                            {benchmarks && benchmarks.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                                    <div className="px-5 py-3 bg-gradient-to-r from-indigo-50 to-white border-b border-slate-100">
                                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Activity size={16} className="text-indigo-500" /> Benchmark Run History</h3>
                                    </div>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-600">
                                                <th className="p-2.5 text-left font-semibold">Run</th>
                                                <th className="p-2.5 text-center font-semibold">Score</th>
                                                <th className="p-2.5 text-center font-semibold">CPU</th>
                                                <th className="p-2.5 text-center font-semibold">MEM</th>
                                                <th className="p-2.5 text-right font-semibold">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {benchmarks.slice(0, 5).map((run, idx) => (
                                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                                                    <td className="p-2.5 font-medium text-slate-700">#{benchmarks.length - idx}</td>
                                                    <td className="p-2.5 text-center">
                                                        <span className="font-mono font-bold" style={{ color: (run.overall || 0) >= 80 ? '#22c55e' : '#eab308' }}>{run.overall || '—'}</span>
                                                    </td>
                                                    <td className="p-2.5 text-center font-mono text-slate-600">{run.cpu || '—'}</td>
                                                    <td className="p-2.5 text-center font-mono text-slate-600">{run.memory || '—'}</td>
                                                    <td className="p-2.5 text-right text-slate-500">{run.date ? new Date(run.date).toLocaleDateString() : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Performance Assessment */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md">
                                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5"><Info size={16} className="text-blue-500" /> Performance Assessment</h3>
                                <ul className="space-y-2.5">
                                    {[
                                        { cond: (latestBenchmark.cpu || 0) >= 85, msg: 'CPU performance is excellent — handles intensive computations efficiently.', severity: 'success' },
                                        { cond: (latestBenchmark.cpu || 0) >= 70 && (latestBenchmark.cpu || 0) < 85, msg: 'CPU performance is good. Consider closing background apps for best results.', severity: 'info' },
                                        { cond: (latestBenchmark.cpu || 0) < 70, msg: 'CPU performance is below average. High background CPU usage may be impacting scores.', severity: 'warning' },
                                        { cond: (latestBenchmark.memory || 0) >= 85, msg: 'Memory throughput is excellent — fast allocation and sorting operations.', severity: 'success' },
                                        { cond: (latestBenchmark.memory || 0) < 70, msg: 'Memory performance is limited. Ensure sufficient free RAM before benchmarking.', severity: 'warning' },
                                        { cond: (latestBenchmark.multitask || 0) >= 80, msg: 'Multi-tasking capability is strong — system handles concurrency well.', severity: 'success' },
                                        { cond: (latestBenchmark.multitask || 0) < 70, msg: 'Multi-task score indicates potential bottleneck in concurrent operations.', severity: 'warning' },
                                    ].filter(t => t.cond).slice(0, 4).map((tip, idx) => (
                                        <li key={idx} className={`p-2.5 rounded-lg border flex gap-2 items-start text-[11px] ${tip.severity === 'success' ? 'bg-emerald-50 border-emerald-200' :
                                            tip.severity === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
                                            }`}>
                                            {tip.severity === 'success' ? <CheckCircle size={13} className="text-emerald-600 shrink-0 mt-0.5" /> :
                                                tip.severity === 'warning' ? <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" /> :
                                                    <Info size={13} className="text-blue-600 shrink-0 mt-0.5" />}
                                            <span className={tip.severity === 'success' ? 'text-emerald-800' : tip.severity === 'warning' ? 'text-amber-800' : 'text-blue-800'}>{tip.msg}</span>
                                        </li>
                                    ))}
                                </ul>
                                {/* Market Position */}
                                <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-cyan-50 border border-indigo-100">
                                    <div className="text-[10px] text-indigo-500 uppercase tracking-wider font-semibold mb-1">System Classification</div>
                                    <div className="text-sm font-bold text-indigo-800">
                                        {latestBenchmark.overall >= 90 ? '🏆 High-Performance Workstation' :
                                            latestBenchmark.overall >= 80 ? '💻 Power User Desktop' :
                                                latestBenchmark.overall >= 70 ? '📊 Productivity Machine' :
                                                    latestBenchmark.overall >= 50 ? '📝 Standard Office System' : '🔋 Budget / Low-Power Device'}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1">Based on overall benchmark score of {latestBenchmark.overall}/100</div>
                                </div>
                            </div>
                        </div>
                    </section>
                )
            }



            {/* ========== CHARTS PAGE 1: 3 area charts stacked vertically ========== */}
            {
                (cpuChartData.length > 0 || netChartData.length > 0 || diskChartData.length > 0) && (
                    <section className="mb-8 pt-2 report-charts-section" style={{ breakBefore: 'page', pageBreakBefore: 'always' }}>
                        <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 pl-4 border-l-4 border-cyan-500 mt-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600"><Activity size={18} /></span>
                            Trend Charts
                        </h2>
                        <div className="space-y-4">
                            {cpuChartData.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md overflow-hidden">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><Cpu size={16} className="text-cyan-500" /> CPU Usage (%)</h3>
                                    <AreaChart width={680} height={180} data={cpuChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <defs><linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} /><stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} /></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 9 }} interval="preserveStartEnd" minTickGap={40} />
                                        <YAxis stroke="#64748b" tick={{ fontSize: 9 }} domain={[0, 100]} width={28} />
                                        <Area type="monotone" dataKey="usage" stroke="#06b6d4" fill="url(#cpuGrad)" strokeWidth={2} isAnimationActive={false} />
                                    </AreaChart>
                                </div>
                            )}
                            {netChartData.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md overflow-hidden">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><Wifi size={16} className="text-violet-500" /> Network Traffic (KB/s)</h3>
                                    <AreaChart width={680} height={180} data={netChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 9 }} interval="preserveStartEnd" minTickGap={40} />
                                        <YAxis stroke="#64748b" tick={{ fontSize: 9 }} domain={[0, 'auto']} width={28} />
                                        <Area type="monotone" dataKey="recv" stackId="1" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} name="Recv" isAnimationActive={false} />
                                        <Area type="monotone" dataKey="sent" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} name="Sent" isAnimationActive={false} />
                                    </AreaChart>
                                </div>
                            )}
                            {diskChartData.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md overflow-hidden">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><HardDrive size={16} className="text-emerald-500" /> Disk I/O (KB/s)</h3>
                                    <AreaChart width={680} height={180} data={diskChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 9 }} interval="preserveStartEnd" minTickGap={40} />
                                        <YAxis stroke="#64748b" tick={{ fontSize: 9 }} domain={[0, 'auto']} width={28} />
                                        <Area type="monotone" dataKey="read" stackId="1" stroke="#059669" fill="#059669" fillOpacity={0.25} name="Read" isAnimationActive={false} />
                                        <Area type="monotone" dataKey="write" stackId="1" stroke="#d97706" fill="#d97706" fillOpacity={0.25} name="Write" isAnimationActive={false} />
                                    </AreaChart>
                                </div>
                            )}
                        </div>
                    </section>
                )
            }

            {/* ========== HISTORICAL ANALYSIS (last page) ========== */}
            {
                (cpuFullHistory.length > 0 || netFullHistory.length > 0 || diskFullHistory.length > 0) && (
                    <section className="mb-8 pt-2" style={{ breakBefore: 'page', pageBreakBefore: 'always' }}>
                        <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-2 pl-4 border-l-4 border-rose-500 mt-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-600"><Activity size={18} /></span>
                            Historical Analysis
                        </h2>
                        <p className="text-xs text-slate-500 mb-4 pl-4">7-day session history — CPU utilization, network throughput, and disk I/O.</p>
                        <div className="space-y-4">
                            {cpuFullHistory.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md overflow-hidden">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><Cpu size={16} className="text-cyan-500" /> CPU Utilization — 7 Days (%)</h3>
                                    <AreaChart width={680} height={190} data={cpuFullHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <defs><linearGradient id="cpuHistGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0891b2" stopOpacity={0.5} /><stop offset="100%" stopColor="#0891b2" stopOpacity={0.05} /></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 8 }} interval="preserveStartEnd" minTickGap={50} />
                                        <YAxis stroke="#64748b" tick={{ fontSize: 8 }} domain={[0, 100]} width={28} />
                                        <Area type="monotone" dataKey="usage" stroke="#0891b2" fill="url(#cpuHistGrad)" strokeWidth={2} isAnimationActive={false} />
                                    </AreaChart>
                                </div>
                            )}
                            {netFullHistory.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md overflow-hidden">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><Wifi size={16} className="text-violet-500" /> Network Throughput — 7 Days (KB/s)</h3>
                                    <AreaChart width={680} height={190} data={netFullHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="netHistRecv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} /><stop offset="100%" stopColor="#7c3aed" stopOpacity={0.05} /></linearGradient>
                                            <linearGradient id="netHistSent" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} /><stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} /></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 8 }} interval="preserveStartEnd" minTickGap={50} />
                                        <YAxis stroke="#64748b" tick={{ fontSize: 8 }} domain={[0, 'auto']} width={28} />
                                        <Area type="monotone" dataKey="recv" stroke="#7c3aed" fill="url(#netHistRecv)" strokeWidth={2} name="Download" isAnimationActive={false} />
                                        <Area type="monotone" dataKey="sent" stroke="#06b6d4" fill="url(#netHistSent)" strokeWidth={2} name="Upload" isAnimationActive={false} />
                                    </AreaChart>
                                </div>
                            )}
                            {diskFullHistory.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md overflow-hidden">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><HardDrive size={16} className="text-emerald-500" /> Disk I/O — 7 Days (KB/s)</h3>
                                    <AreaChart width={680} height={190} data={diskFullHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="diskHistRead" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#059669" stopOpacity={0.4} /><stop offset="100%" stopColor="#059669" stopOpacity={0.05} /></linearGradient>
                                            <linearGradient id="diskHistWrite" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d97706" stopOpacity={0.4} /><stop offset="100%" stopColor="#d97706" stopOpacity={0.05} /></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 8 }} interval="preserveStartEnd" minTickGap={50} />
                                        <YAxis stroke="#64748b" tick={{ fontSize: 8 }} domain={[0, 'auto']} width={28} />
                                        <Area type="monotone" dataKey="read" stroke="#059669" fill="url(#diskHistRead)" strokeWidth={2} name="Read" isAnimationActive={false} />
                                        <Area type="monotone" dataKey="write" stroke="#d97706" fill="url(#diskHistWrite)" strokeWidth={2} name="Write" isAnimationActive={false} />
                                    </AreaChart>
                                </div>
                            )}
                        </div>
                    </section>
                )
            }

            {/* ========== FOOTER ========== */}
            <footer className="mt-12 pt-8 pb-4 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200">
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600">
                    <span className="font-bold text-slate-700">Operating Systems Power Consumption Analyzer</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">v1.2.0</span>
                    <span className="text-slate-400">•</span>
                    <span>Automated System Report</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-slate-500">{date}</span>
                </div>
                <div className="mt-3 h-1 w-32 mx-auto rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 opacity-70" />
            </footer>

        </div >
    );
});
ReportDocument.displayName = 'ReportDocument';

export default ReportDocument;
