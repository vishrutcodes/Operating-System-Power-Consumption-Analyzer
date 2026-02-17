import { useContext, useMemo } from 'react';
import { MetricsContext } from '../App';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Cpu, HardDrive, Wifi, Activity, MemoryStick, Gauge } from 'lucide-react';

function formatBytes(bytes) {
    if (bytes == null || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function Resources() {
    const { data, history } = useContext(MetricsContext);

    const netRateHistory = useMemo(() => {
        const net = history?.net ?? [];
        return net.slice(-60).map((point) => ({
            time: point.time,
            sent: (point.sent_rate ?? 0) / 1024,
            recv: (point.recv_rate ?? 0) / 1024
        }));
    }, [history?.net]);

    const diskRateHistory = useMemo(() => {
        const disk = history?.disk ?? [];
        return disk.slice(-60).map((point) => ({
            time: point.time,
            read: (point.read_rate ?? 0) / 1024,
            write: (point.write_rate ?? 0) / 1024
        }));
    }, [history?.disk]);

    const cpuHistory = useMemo(() => {
        const cpu = history?.cpu ?? [];
        return cpu.slice(-60).map((p) => ({ time: p.time, usage: p.usage ?? 0 }));
    }, [history?.cpu]);

    const currentNetRate = useMemo(() => {
        const net = history?.net ?? [];
        const last = net[net.length - 1];
        if (!last) return { sent: 0, recv: 0 };
        return { sent: (last.sent_rate ?? 0) / 1024, recv: (last.recv_rate ?? 0) / 1024 };
    }, [history?.net]);

    const currentDiskRate = useMemo(() => {
        const disk = history?.disk ?? [];
        const last = disk[disk.length - 1];
        if (!last) return { read: 0, write: 0 };
        return { read: (last.read_rate ?? 0) / 1024, write: (last.write_rate ?? 0) / 1024 };
    }, [history?.disk]);

    if (!data) return null;

    const cpu = data.cpu ?? {};
    const memory = data.memory;
    const sysInfo = data.sys_info ?? {};
    const cpuCores = data.cpu_cores ?? [];

    return (
        <div className="flex flex-col gap-8">
            {/* Quick stats strip */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 flex items-center gap-3 group cursor-default">
                    <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors duration-300">
                        <Cpu className="text-blue-400" size={22} />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">CPU</div>
                        <div className="text-lg font-bold text-slate-200">{Number(cpu.usage_percent ?? 0).toFixed(1)}%</div>
                        <div className="text-[10px] text-slate-400">{Number(cpu.frequency_current ?? 0).toFixed(0)} MHz</div>
                    </div>
                </div>
                <div className="glass-panel p-4 flex items-center gap-3 group cursor-default">
                    <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors duration-300">
                        <MemoryStick className="text-purple-400" size={22} />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Memory</div>
                        <div className="text-lg font-bold text-slate-200">{memory ? `${Number(memory.percent ?? 0).toFixed(1)}%` : '—'}</div>
                        <div className="text-[10px] text-slate-400">{memory ? formatBytes(memory.used) + ' / ' + formatBytes(memory.total) : '—'}</div>
                    </div>
                </div>
                <div className="glass-panel p-4 flex items-center gap-3 group cursor-default">
                    <div className="p-2 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors duration-300">
                        <Wifi className="text-cyan-400" size={22} />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Network</div>
                        <div className="text-lg font-bold text-slate-200">↓ {(currentNetRate.recv).toFixed(0)} ↑ {(currentNetRate.sent).toFixed(0)} KB/s</div>
                        <div className="text-[10px] text-slate-400">Download / Upload</div>
                    </div>
                </div>
                <div className="glass-panel p-4 flex items-center gap-3 group cursor-default">
                    <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors duration-300">
                        <HardDrive className="text-emerald-400" size={22} />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Disk I/O</div>
                        <div className="text-lg font-bold text-slate-200">R {(currentDiskRate.read).toFixed(0)} W {(currentDiskRate.write).toFixed(0)} KB/s</div>
                        <div className="text-[10px] text-slate-400">Read / Write</div>
                    </div>
                </div>
            </section>

            {/* CPU usage trend + CPU Cores */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-6 h-[220px] flex flex-col">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Activity className="text-cyan-400" /> CPU Usage Trend
                    </h3>
                    <div className="flex-1 min-h-0">
                        {cpuHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={cpuHistory} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="resCpuGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={40} />
                                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 100]} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} formatter={(v) => [`${Number(v).toFixed(1)}%`, 'CPU']} />
                                    <Area type="monotone" dataKey="usage" stroke="#06b6d4" fill="url(#resCpuGrad)" strokeWidth={2} name="CPU %" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-sm">Waiting for CPU history...</div>
                        )}
                    </div>
                </div>
                <div className="glass-panel p-4 flex flex-col">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Gauge className="text-blue-400" /> System
                    </h3>
                    <div className="text-sm text-slate-400 space-y-1">
                        {sysInfo.cpu_model && <div className="truncate" title={sysInfo.cpu_model}><span className="text-slate-500">CPU:</span> {sysInfo.cpu_model}</div>}
                        {sysInfo.platform && <div><span className="text-slate-500">OS:</span> {sysInfo.platform}</div>}
                        {sysInfo.load_avg && Array.isArray(sysInfo.load_avg) && (
                            <div><span className="text-slate-500">Load:</span> {sysInfo.load_avg.map((l, i) => l?.toFixed(2)).join(', ')}</div>
                        )}
                    </div>
                </div>
            </section>

            {/* CPU Cores Section */}
            <section>
                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <Cpu className="text-blue-400" /> CPU Core Breakdown
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {cpuCores.map((usage, idx) => (
                        <div key={idx} className="glass-panel p-3 flex flex-col items-center justify-center relative overflow-hidden group cursor-default">
                            <div className="text-xs text-slate-500 font-mono mb-1">CORE {idx}</div>
                            <div className="text-lg font-bold text-slate-200">{usage.toFixed(0)}%</div>
                            <div className="w-full bg-slate-700/50 h-2 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 rounded-full"
                                    style={{ width: `${usage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Network & Disk Graphs */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 h-[350px] flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Wifi className="text-purple-400" /> Network Traffic (KB/s)
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={netRateHistory} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={40} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} formatter={(v) => `${Number(v).toFixed(1)} KB/s`} />
                                <Area type="monotone" dataKey="recv" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} name="Download" isAnimationActive={false} />
                                <Area type="monotone" dataKey="sent" stackId="1" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.6} name="Upload" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel p-6 h-[350px] flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <HardDrive className="text-emerald-400" /> Disk I/O (KB/s)
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={diskRateHistory} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={40} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} formatter={(v) => `${Number(v).toFixed(1)} KB/s`} />
                                <Area type="monotone" dataKey="read" stackId="1" stroke="#34d399" fill="#34d399" fillOpacity={0.6} name="Read" isAnimationActive={false} />
                                <Area type="monotone" dataKey="write" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Write" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Resources;
