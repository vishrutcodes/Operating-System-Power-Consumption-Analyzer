import { useContext, useState, useEffect, useMemo } from 'react';
import { MetricsContext } from '../App';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
    DollarSign, Leaf, Zap, TrendingUp, Settings, Battery, Cpu,
    MemoryStick, Monitor, Clock, AlertTriangle, ChevronDown, ChevronUp,
    Calculator, Globe, Flame, BarChart3
} from 'lucide-react';

const ENERGY_REGIONS = [
    { name: 'India', rate: 6.5, currency: '\u20B9', co2: 0.82, unit: 'kWh' },
    { name: 'US Average', rate: 0.16, currency: '$', co2: 0.42, unit: 'kWh' },
    { name: 'EU Average', rate: 0.25, currency: '\u20AC', co2: 0.30, unit: 'kWh' },
    { name: 'UK', rate: 0.34, currency: '\u00A3', co2: 0.23, unit: 'kWh' },
    { name: 'Germany', rate: 0.40, currency: '\u20AC', co2: 0.35, unit: 'kWh' },
    { name: 'Japan', rate: 27, currency: '\u00A5', co2: 0.47, unit: 'kWh' },
    { name: 'Australia', rate: 0.30, currency: 'A$', co2: 0.66, unit: 'kWh' },
    { name: 'Custom', rate: 0.15, currency: '$', co2: 0.40, unit: 'kWh' },
];

const TDP_ESTIMATES = {
    desktop: { idle: 50, full: 250 },
    laptop: { idle: 8, full: 65 },
    workstation: { idle: 80, full: 400 },
};

function EnergyEstimator() {
    const { data, history } = useContext(MetricsContext);
    const [region, setRegion] = useState(() => {
        const saved = localStorage.getItem('powerpulse_energy_region');
        return saved ? JSON.parse(saved) : ENERGY_REGIONS[0];
    });
    const [customRate, setCustomRate] = useState(region.rate);
    const [customCo2, setCustomCo2] = useState(region.co2);
    const [systemType, setSystemType] = useState(() =>
        localStorage.getItem('powerpulse_system_type') || 'laptop'
    );
    const [showSettings, setShowSettings] = useState(false);
    const [costHistory, setCostHistory] = useState([]);
    const [dailyBudget, setDailyBudget] = useState(() => {
        const saved = localStorage.getItem('powerpulse_daily_budget');
        return saved ? parseFloat(saved) : 5.0;
    });

    const isOnBattery = data?.battery && !data.battery.power_plugged;
    const cpuUsage = data?.cpu?.usage_percent || 0;
    const memUsage = data?.memory?.percent || 0;

    const tdp = TDP_ESTIMATES[systemType];
    const currentWatts = useMemo(() => {
        const cpuFactor = cpuUsage / 100;
        const memFactor = (memUsage / 100) * 0.15;
        return tdp.idle + (tdp.full - tdp.idle) * (cpuFactor * 0.85 + memFactor);
    }, [cpuUsage, memUsage, tdp]);

    const activeRate = region.name === 'Custom' ? customRate : region.rate;
    const activeCo2 = region.name === 'Custom' ? customCo2 : region.co2;
    const currency = region.currency;

    const hourlyKwh = currentWatts / 1000;
    const hourlyCost = hourlyKwh * activeRate;
    const dailyCost = hourlyCost * 24;
    const monthlyCost = dailyCost * 30;
    const yearlyCost = dailyCost * 365;

    const hourlyCo2 = hourlyKwh * activeCo2 * 1000;
    const dailyCo2 = hourlyCo2 * 24;
    const monthlyCo2 = dailyCo2 * 30;

    const budgetPercent = Math.min((dailyCost / dailyBudget) * 100, 100);

    useEffect(() => {
        localStorage.setItem('powerpulse_energy_region', JSON.stringify(region));
    }, [region]);

    useEffect(() => {
        localStorage.setItem('powerpulse_system_type', systemType);
    }, [systemType]);

    useEffect(() => {
        localStorage.setItem('powerpulse_daily_budget', dailyBudget.toString());
    }, [dailyBudget]);

    useEffect(() => {
        if (!data) return;
        const interval = setInterval(() => {
            setCostHistory(prev => {
                const now = new Date().toLocaleTimeString();
                const entry = {
                    time: now,
                    watts: parseFloat(currentWatts.toFixed(1)),
                    cost: parseFloat((hourlyCost * 100).toFixed(2)),
                    co2: parseFloat(hourlyCo2.toFixed(1)),
                };
                return [...prev, entry].slice(-60);
            });
        }, 2000);
        return () => clearInterval(interval);
    }, [data, currentWatts, hourlyCost, hourlyCo2]);

    const processPowerData = useMemo(() => {
        if (!data?.processes) return [];
        return data.processes
            .slice()
            .sort((a, b) => (b.cpu_percent || 0) - (a.cpu_percent || 0))
            .slice(0, 8)
            .map(p => ({
                name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
                watts: parseFloat(((p.cpu_percent / 100) * (tdp.full - tdp.idle)).toFixed(1)),
                cpu: p.cpu_percent,
            }));
    }, [data?.processes, tdp]);

    const costBreakdownData = useMemo(() => [
        { name: 'CPU', value: Math.round(cpuUsage * 0.7), fill: '#06b6d4' },
        { name: 'Memory', value: Math.round(memUsage * 0.15), fill: '#a855f7' },
        { name: 'Display', value: 15, fill: '#eab308' },
        { name: 'Other', value: 10, fill: '#64748b' },
    ], [cpuUsage, memUsage]);

    const treesNeeded = (monthlyCo2 / 1000 / 21).toFixed(2);

    if (!data) return null;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                        <DollarSign className="text-green-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">Energy & Cost Estimator</h1>
                        <p className="text-sm text-slate-400">Real-time power consumption and cost analysis</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl text-slate-300 transition-colors border border-slate-700/50"
                >
                    <Settings size={16} />
                    Configure
                    {showSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </motion.div>

            {/* Settings Panel */}
            {showSettings && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="glass-panel p-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-xs text-slate-400 uppercase tracking-wide mb-2 block">Region / Rate</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-green-500"
                                value={region.name}
                                onChange={(e) => {
                                    const r = ENERGY_REGIONS.find(r => r.name === e.target.value);
                                    if (r) setRegion(r);
                                }}
                            >
                                {ENERGY_REGIONS.map(r => (
                                    <option key={r.name} value={r.name}>{r.name} ({r.currency}{r.rate}/{r.unit})</option>
                                ))}
                            </select>
                            {region.name === 'Custom' && (
                                <div className="mt-3 flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-slate-500 block mb-1">Rate per kWh</label>
                                        <input
                                            type="number" step="0.01" value={customRate}
                                            onChange={(e) => setCustomRate(parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-sm"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-slate-500 block mb-1">CO2 kg/kWh</label>
                                        <input
                                            type="number" step="0.01" value={customCo2}
                                            onChange={(e) => setCustomCo2(parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 uppercase tracking-wide mb-2 block">System Type</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-green-500"
                                value={systemType}
                                onChange={(e) => setSystemType(e.target.value)}
                            >
                                <option value="laptop">Laptop (8-65W)</option>
                                <option value="desktop">Desktop (50-250W)</option>
                                <option value="workstation">Workstation (80-400W)</option>
                            </select>
                            <p className="text-[10px] text-slate-500 mt-2">TDP range: {tdp.idle}W idle — {tdp.full}W full load</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 uppercase tracking-wide mb-2 block">Daily Budget ({currency})</label>
                            <input
                                type="number" step="0.5" value={dailyBudget}
                                onChange={(e) => setDailyBudget(parseFloat(e.target.value) || 1)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-green-500"
                            />
                            <p className="text-[10px] text-slate-500 mt-2">Get warned when daily cost approaches this limit</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Live Power Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Zap size={14} className="text-yellow-400" />
                        Current Draw
                    </div>
                    <div className="text-3xl font-bold text-yellow-400">{currentWatts.toFixed(1)}<span className="text-sm font-normal text-slate-500 ml-1">W</span></div>
                    <div className="text-xs text-slate-500 mt-1">{isOnBattery ? 'On Battery' : 'Plugged In'}</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <DollarSign size={14} className="text-green-400" />
                        Hourly Cost
                    </div>
                    <div className="text-3xl font-bold text-green-400">{currency}{hourlyCost.toFixed(3)}</div>
                    <div className="text-xs text-slate-500 mt-1">{hourlyKwh.toFixed(4)} kWh</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Calculator size={14} className="text-cyan-400" />
                        Monthly Est.
                    </div>
                    <div className="text-3xl font-bold text-cyan-400">{currency}{monthlyCost.toFixed(2)}</div>
                    <div className="text-xs text-slate-500 mt-1">{currency}{yearlyCost.toFixed(2)}/year</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Leaf size={14} className="text-emerald-400" />
                        CO2 / Hour
                    </div>
                    <div className="text-3xl font-bold text-emerald-400">{hourlyCo2.toFixed(1)}<span className="text-sm font-normal text-slate-500 ml-1">g</span></div>
                    <div className="text-xs text-slate-500 mt-1">{(monthlyCo2 / 1000).toFixed(2)} kg/month</div>
                </motion.div>
            </div>

            {/* Budget Progress + Carbon Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Budget */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                        <BarChart3 size={20} className="text-green-400" /> Daily Budget Tracker
                    </h3>
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Projected: {currency}{dailyCost.toFixed(2)}</span>
                            <span className="text-slate-400">Budget: {currency}{dailyBudget.toFixed(2)}</span>
                        </div>
                        <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${budgetPercent}%` }}
                                transition={{ duration: 1 }}
                                className={`h-full rounded-full ${budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            />
                        </div>
                        <div className="text-xs text-slate-500 mt-2 text-right">{budgetPercent.toFixed(0)}% of budget</div>
                    </div>
                    {budgetPercent > 90 && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300">
                            <AlertTriangle size={16} />
                            Projected daily cost is near or exceeding your budget!
                        </div>
                    )}

                    {/* Cost Breakdown Pie */}
                    <div className="mt-4">
                        <h4 className="text-sm text-slate-400 mb-3">Cost Breakdown (estimated)</h4>
                        <div className="flex items-center gap-4">
                            <div className="w-[120px] h-[120px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={costBreakdownData} dataKey="value" cx="50%" cy="50%"
                                            innerRadius={35} outerRadius={55} paddingAngle={3}
                                        >
                                            {costBreakdownData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col gap-2">
                                {costBreakdownData.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                        <span className="text-slate-300">{item.name}</span>
                                        <span className="text-slate-500">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Carbon Footprint */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                        <Globe size={20} className="text-emerald-400" /> Carbon Footprint
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase">Daily CO2</div>
                            <div className="text-2xl font-bold text-emerald-400">{(dailyCo2 / 1000).toFixed(2)}<span className="text-sm font-normal text-slate-500 ml-1">kg</span></div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase">Monthly CO2</div>
                            <div className="text-2xl font-bold text-emerald-400">{(monthlyCo2 / 1000).toFixed(2)}<span className="text-sm font-normal text-slate-500 ml-1">kg</span></div>
                        </div>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-3">
                            <Leaf size={24} className="text-emerald-400" />
                            <div>
                                <div className="text-sm font-medium text-emerald-300">Trees to offset</div>
                                <div className="text-xs text-emerald-200/60">
                                    You'd need approximately <strong className="text-emerald-300">{treesNeeded} trees</strong> to offset your monthly emissions
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                        <div className="text-xs text-slate-400 mb-2">Region: {region.name}</div>
                        <div className="text-xs text-slate-500">Grid carbon intensity: {activeCo2} kg CO2/kWh</div>
                        <div className="text-xs text-slate-500">Lower values = cleaner energy grid</div>
                    </div>
                </div>
            </div>

            {/* Real-time Power Trend */}
            {costHistory.length > 2 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-cyan-400" /> Live Power Consumption
                    </h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={costHistory}>
                                <defs>
                                    <linearGradient id="colorWatts" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                                <Area type="monotone" dataKey="watts" name="Watts" stroke="#eab308" strokeWidth={2} fill="url(#colorWatts)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            {/* Per-Process Power */}
            {processPowerData.length > 0 && (
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                        <Flame size={20} className="text-orange-400" /> Per-Process Power Draw
                    </h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={processPowerData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={120} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                                    formatter={(v) => [`${v}W`, 'Est. Power']}
                                />
                                <Bar dataKey="watts" radius={[0, 4, 4, 0]} barSize={16}>
                                    {processPowerData.map((_, i) => (
                                        <Cell key={i} fill={i === 0 ? '#ef4444' : i < 3 ? '#f97316' : '#64748b'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Power Saving Tips */}
            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-yellow-400" /> Power Saving Tips
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { icon: Monitor, text: 'Lower screen brightness by 20% to save ~15% display power', color: 'text-yellow-400' },
                        { icon: Cpu, text: 'Close idle background processes to reduce CPU wake-ups', color: 'text-cyan-400' },
                        { icon: MemoryStick, text: 'Free unused RAM to reduce memory controller power', color: 'text-purple-400' },
                        { icon: Battery, text: 'Keep battery between 20-80% for optimal longevity', color: 'text-green-400' },
                        { icon: Clock, text: 'Use sleep mode when away for more than 15 minutes', color: 'text-blue-400' },
                        { icon: Globe, text: 'Consider renewable energy providers to reduce CO2 impact', color: 'text-emerald-400' },
                    ].map((tip, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30"
                        >
                            <tip.icon size={16} className={`${tip.color} shrink-0 mt-0.5`} />
                            <span className="text-sm text-slate-400">{tip.text}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default EnergyEstimator;
