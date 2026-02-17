import { useContext } from 'react';
import { MetricsContext } from '../App';
import { AreaChart, Area, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Battery, Zap, Cpu, ShieldCheck, Unplug } from 'lucide-react';
import { motion } from 'framer-motion';

function formatTimeLeft(seconds) {
    if (seconds == null || seconds < 0) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return '< 1m';
}

function Dashboard() {
    const { data, history, isConnected } = useContext(MetricsContext);

    const emptyData = {
        battery: { percent: 0, status: 'Unknown', power_plugged: false, power_watts: 0 },
        cpu: { usage_percent: 0, frequency_current: 0 },
        health_score: 0,
        processes: []
    };

    const displayData = data || emptyData;
    const { battery, cpu } = displayData;

    const batterySub = battery.power_plugged
        ? battery.status
        : (battery.secsleft != null && battery.secsleft !== undefined
            ? `${formatTimeLeft(battery.secsleft)} left`
            : battery.status);

    const summaryMessage = displayData.health_score >= 80
        ? 'System running smoothly.'
        : (displayData.suggestions?.length > 0
            ? displayData.suggestions[0].message
            : 'Review Insights for recommendations.');

    return (
        <div className={`flex flex-col gap-6`}>
            {/* Header / Loading State */}
            {!data && (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 w-fit">
                    <Unplug size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-400">Waiting for connection...</span>
                </div>
            )}

            {/* Dynamic one-line summary */}
            {data && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/40 border border-white/5 w-fit backdrop-blur-sm"
                >
                    <span className={`w-2.5 h-2.5 rounded-full status-pulse ${displayData.health_score >= 80 ? 'bg-green-500 text-green-500' : displayData.health_score >= 50 ? 'bg-yellow-500 text-yellow-500' : 'bg-red-500 text-red-500'}`} />
                    <span className="text-sm text-slate-300">{summaryMessage}</span>
                </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Battery Level"
                    value={`${battery.percent.toFixed(1)}%`}
                    sub={batterySub}
                    icon={<Battery className="text-green-400" />}
                    color="green"
                    progress={battery.percent}
                    delay={0}
                />
                <StatCard
                    title="Power Draw"
                    value={battery.power_watts ? `${battery.power_watts.toFixed(2)} W` : "On AC"}
                    sub={battery.power_plugged ? "Plugged In" : "Discharging"}
                    icon={<Zap className="text-yellow-400" />}
                    color="yellow"
                    delay={1}
                />
                <StatCard
                    title="CPU Utilization"
                    value={`${cpu.usage_percent}%`}
                    sub={`${cpu.frequency_current.toFixed(0)} MHz`}
                    icon={<Cpu className="text-blue-400" />}
                    color="blue"
                    progress={cpu.usage_percent}
                    delay={2}
                />
                <StatCard
                    title="System Health"
                    value={`${displayData.health_score}/100`}
                    sub="Stability Score"
                    icon={<ShieldCheck className="text-purple-400" />}
                    color="purple"
                    progress={displayData.health_score}
                    delay={3}
                />
            </div>

            {/* Main Graph Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CPU Chart */}
                <div className="glass-panel p-6 h-[300px] flex flex-col">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-cyan-400" /> CPU Usage Trend
                    </h2>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history.cpu}>
                                <defs>
                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    itemStyle={{ color: '#22d3ee' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="usage"
                                    stroke="#06b6d4"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCpu)"
                                    isAnimationActive={true}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Network Chart */}
                <div className="glass-panel p-6 h-[300px] flex flex-col">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-purple-400" /> Network Activity (KB/s)
                    </h2>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history.net}>
                                <defs>
                                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="recv_rate"
                                    name="Download"
                                    stroke="#a855f7"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorNet)"
                                    isAnimationActive={true}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sent_rate"
                                    name="Upload"
                                    stroke="#f472b6"
                                    strokeWidth={2}
                                    fillOpacity={0.1}
                                    fill="#f472b6"
                                    isAnimationActive={true}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Disk Chart */}
                <div className="glass-panel col-span-2 p-6 h-[300px] flex flex-col">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-yellow-400" /> Disk Activity (KB/s)
                    </h2>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history.disk}>
                                <defs>
                                    <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="read_rate"
                                    name="Read"
                                    stroke="#eab308"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorDisk)"
                                    isAnimationActive={true}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="write_rate"
                                    name="Write"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    fillOpacity={0.1}
                                    fill="#f97316"
                                    isAnimationActive={true}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Process Look */}
                <div className="glass-panel p-0 flex flex-col h-[300px]">
                    <div className="p-6 border-b border-slate-700/50 bg-slate-800/30">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Zap size={20} className="text-red-400" /> Top Power Hogs
                        </h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-slate-500 border-b border-slate-700/50">
                                    <th className="p-3">Name</th>
                                    <th className="p-3 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayData.processes.slice(0, 5).map(proc => (
                                    <tr key={proc.pid} className="border-b border-slate-700/30">
                                        <td className="p-3 truncate max-w-[100px]" title={proc.name}>{proc.name}</td>
                                        <td className="p-3 text-right font-mono text-red-400">{proc.power_score.toFixed(1)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 text-center border-t border-slate-700/50">
                        <a href="/processes" className="text-xs text-cyan-400 hover:text-cyan-300">View All Processes &rarr;</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, sub, icon, color, progress, delay = 0 }) {
    const colorClasses = {
        green: "text-green-400 bg-green-500/10 border-green-500/20",
        yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    };

    const progressColors = {
        green: "from-green-500 to-emerald-400",
        yellow: "from-yellow-500 to-amber-400",
        blue: "from-blue-500 to-cyan-400",
        purple: "from-purple-500 to-pink-400",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.1, duration: 0.4, ease: "easeOut" }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`glass-panel p-4 flex flex-col justify-between relative overflow-hidden group cursor-default`}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-slate-400 text-sm font-medium">{title}</span>
                <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className={`p-2 rounded-lg ${colorClasses[color]} transition-all duration-300`}
                >
                    {icon}
                </motion.div>
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-100">{value}</div>
                <div className="text-xs text-slate-500 mt-1">{sub}</div>
            </div>
            {progress !== undefined && (
                <div className="w-full h-1.5 bg-slate-700/50 mt-3 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ delay: delay * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r ${progressColors[color]} rounded-full`}
                    />
                </div>
            )}
            {/* Subtle glow effect on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br ${progressColors[color]} blur-3xl -z-10`} style={{ opacity: 0.05 }} />
        </motion.div>
    )
}

export default Dashboard;
