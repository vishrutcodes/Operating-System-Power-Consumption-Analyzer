import { useContext, useState, useEffect, useMemo } from 'react';
import { MetricsContext } from '../App';
import { Thermometer, TriangleAlert, Cpu, TrendingUp, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';

function getTempColor(temp, high = 85, critical = 100) {
    if (temp >= critical) return { text: 'text-red-400', bg: 'bg-red-500', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]', bar: '#ef4444' };
    if (temp >= high) return { text: 'text-orange-400', bg: 'bg-orange-500', glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]', bar: '#f97316' };
    if (temp >= 65) return { text: 'text-yellow-400', bg: 'bg-yellow-500', glow: '', bar: '#eab308' };
    if (temp >= 45) return { text: 'text-cyan-400', bg: 'bg-cyan-500', glow: '', bar: '#06b6d4' };
    return { text: 'text-blue-400', bg: 'bg-blue-500', glow: '', bar: '#3b82f6' };
}

function ThermalMonitor() {
    const { data, history } = useContext(MetricsContext);
    // Use global history if available, otherwise fallback to empty (App.jsx handles update)
    const tempHistory = history?.thermal || [];

    const thermal = data?.thermal || { sensors: [], max_temp: 0, avg_temp: 0, is_throttling: false, available: false };

    // Separate package/overall sensor from core sensors
    const packageSensor = thermal.sensors.find(s => s.label?.toLowerCase().includes('package') || s.label?.toLowerCase().includes('cpu'));
    const coreSensors = thermal.sensors.filter(s => s !== packageSensor);

    // Bar chart data for per-core temps
    const coreBarData = useMemo(() => {
        return coreSensors.map(s => ({
            name: s.label,
            temp: s.current,
            high: s.high || 85,
            critical: s.critical || 100,
        }));
    }, [coreSensors]);

    if (!thermal.available) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
                <Thermometer size={64} className="opacity-20" />
                <p>Thermal data unavailable. Waiting for connection...</p>
            </div>
        );
    }

    const maxTempColors = getTempColor(thermal.max_temp);
    const avgTempColors = getTempColor(thermal.avg_temp);

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/50 ${thermal.is_throttling ? 'animate-pulse' : ''}`}>
                        <Thermometer className="text-orange-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Thermal Monitor</h1>
                        <p className="text-sm text-slate-500">Real-time CPU temperature monitoring</p>
                    </div>
                </div>

                {thermal.is_throttling && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 animate-pulse"
                    >
                        <TriangleAlert size={18} />
                        <span className="font-semibold text-sm">THERMAL THROTTLING DETECTED</span>
                    </motion.div>
                )}
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ThermalCard
                    title="Max Temperature"
                    value={`${thermal.max_temp}°C`}
                    sub={thermal.is_throttling ? 'Throttling!' : 'Peak reading'}
                    color={maxTempColors}
                    icon={<Thermometer size={20} />}
                    delay={0}
                />
                <ThermalCard
                    title="Average Temperature"
                    value={`${thermal.avg_temp}°C`}
                    sub="Across all sensors"
                    color={avgTempColors}
                    icon={<TrendingUp size={20} />}
                    delay={1}
                />
                <ThermalCard
                    title="Active Sensors"
                    value={thermal.sensors.length}
                    sub="Temperature probes"
                    color={getTempColor(40)}
                    icon={<Cpu size={20} />}
                    delay={2}
                />
                <ThermalCard
                    title="CPU Package"
                    value={packageSensor ? `${packageSensor.current}°C` : '—'}
                    sub={packageSensor ? `High: ${packageSensor.high || 85}°C` : 'N/A'}
                    color={packageSensor ? getTempColor(packageSensor.current) : getTempColor(0)}
                    icon={<Thermometer size={20} />}
                    delay={3}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Temperature Trend */}
                <div className="glass-panel p-6 h-[320px] flex flex-col">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-orange-400" /> Temperature Trend
                    </h2>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={tempHistory}>
                                <defs>
                                    <linearGradient id="colorMaxTemp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorAvgTemp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94a3b8" interval="preserveStartEnd" />
                                <YAxis domain={[20, 110]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                <Area type="monotone" dataKey="max" name="Max °C" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorMaxTemp)" />
                                <Area type="monotone" dataKey="avg" name="Avg °C" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorAvgTemp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Per-Core Temperature Bar */}
                <div className="glass-panel p-6 h-[320px] flex flex-col">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Cpu size={18} className="text-cyan-400" /> Per-Core Temperatures
                    </h2>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={coreBarData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                                <YAxis domain={[0, 110]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    formatter={(v) => [`${v}°C`, 'Temp']}
                                />
                                <Bar dataKey="temp" radius={[4, 4, 0, 0]}>
                                    {coreBarData.map((entry, i) => (
                                        <Cell key={i} fill={getTempColor(entry.temp, entry.high, entry.critical).bar} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Advanced Analysis Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Temperature Distribution */}
                <div className="glass-panel p-6 h-[320px] flex flex-col">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Thermometer size={18} className="text-purple-400" /> Temperature Distribution
                    </h2>
                    <div className="flex-1 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Cool (<45°C)', value: thermal.sensors.filter(s => s.current < 45).length, color: '#3b82f6' },
                                        { name: 'Normal (45-65°C)', value: thermal.sensors.filter(s => s.current >= 45 && s.current < 65).length, color: '#06b6d4' },
                                        { name: 'Warm (65-85°C)', value: thermal.sensors.filter(s => s.current >= 65 && s.current < 85).length, color: '#eab308' },
                                        { name: 'Hot (>85°C)', value: thermal.sensors.filter(s => s.current >= 85).length, color: '#ef4444' },
                                    ].filter(d => d.value > 0)}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
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
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top 5 Hottest Sensors */}
                <div className="glass-panel p-6 h-[320px] flex flex-col">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Flame size={18} className="text-red-400" /> Hottest Sensors
                    </h2>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={[...thermal.sensors].sort((a, b) => (b.current || 0) - (a.current || 0)).slice(0, 5)}
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" domain={[0, 110]} hide />
                                <YAxis dataKey="label" type="category" width={100} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                />
                                <Bar dataKey="current" radius={[0, 4, 4, 0]} barSize={20}>
                                    {[...thermal.sensors].sort((a, b) => (b.current || 0) - (a.current || 0)).slice(0, 5).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getTempColor(entry.current).bar} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Heat Map Grid */}
            <div className="glass-panel p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Thermometer size={18} className="text-orange-400" /> Sensor Heat Map
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {thermal.sensors.map((sensor, i) => {
                        const colors = getTempColor(sensor.current, sensor.high || 85, sensor.critical || 100);
                        const pct = Math.min(100, Math.max(0, ((sensor.current - 20) / 80) * 100));
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.03 }}
                                className={`relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 flex flex-col items-center gap-2 group hover:border-opacity-80 transition-all ${colors.glow}`}
                            >
                                {/* Background fill based on temperature */}
                                <div
                                    className={`absolute bottom-0 left-0 right-0 ${colors.bg} opacity-10 transition-all duration-500`}
                                    style={{ height: `${pct}%` }}
                                />
                                <span className="text-xs text-slate-500 font-medium truncate w-full text-center z-10">{sensor.label}</span>
                                <span className={`text-2xl font-bold ${colors.text} z-10 font-mono`}>{sensor.current}°</span>
                                <div className="flex gap-2 text-[10px] text-slate-600 z-10">
                                    {sensor.high && <span>H:{sensor.high}°</span>}
                                    {sensor.critical && <span>C:{sensor.critical}°</span>}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function ThermalCard({ title, value, sub, color, icon, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.1, duration: 0.4 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="glass-panel p-4 flex flex-col justify-between relative overflow-hidden group cursor-default"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-slate-400 text-sm font-medium">{title}</span>
                <div className={`p-2 rounded-lg ${color.text} bg-white/5 border border-white/10 transition-all`}>
                    {icon}
                </div>
            </div>
            <div>
                <div className={`text-2xl font-bold ${color.text}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-1">{sub}</div>
            </div>
        </motion.div>
    );
}

export default ThermalMonitor;
