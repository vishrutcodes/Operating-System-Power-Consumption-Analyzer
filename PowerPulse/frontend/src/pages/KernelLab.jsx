import { useContext, useState, useEffect, useMemo, useRef } from 'react';
import { MetricsContext } from '../App';
import { Cpu, Activity, Play, Pause, Layers, Hash, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

// helper: fetch with timeout
async function fetchWithTimeout(url, opts = {}, timeout = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, { ...opts, signal: controller.signal });
        clearTimeout(id);
        return res;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

const API_BASE = "http://127.0.0.1:8000/api/process";

function KernelLab() {
    const { data, isConnected } = useContext(MetricsContext);
    const connAlertRef = useRef(0);
    const CONN_COOLDOWN = 10000;
    const showBackendOffline = () => {
        const now = Date.now();
        if (now - connAlertRef.current > CONN_COOLDOWN) {
            setActionMsg({ type: 'error', text: 'Backend offline — start the API server (run run-dev.ps1 or python run_dev.py)' });
            connAlertRef.current = now;
            setTimeout(() => setActionMsg(null), 3000);
        }
    };
    const [selectedPid, setSelectedPid] = useState(null);
    const [details, setDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [actionMsg, setActionMsg] = useState(null);
    const [overrides, setOverrides] = useState({});

    // Derived from data
    const processes = data?.processes || [];
    const cpuCount = data?.cpu?.core_count || 1;
    const selectedProcess = processes.find(p => p.pid === selectedPid);
    const displayedProcess = useMemo(() => {
        if (!selectedProcess) return null;
        const ov = overrides[selectedPid] || {};
        return { ...selectedProcess, ...ov };
    }, [selectedProcess, overrides, selectedPid]);
    const cpuCoresData = useMemo(() =>
        (data?.cpu_cores || []).map((pct, i) => ({ core: `C${i}`, usage: Number(pct) || 0 })),
        [data?.cpu_cores]
    );
    const processStatsPieData = useMemo(() => {
        if (!details) return [];
        const t = Number(details.threads) || 0;
        const h = Number(details.handles) || 0;

        // Don't hide the chart if values exist. Use raw values for authenticity.
        // We'll trust the PieChart to handle the ratios.
        // If handles are huge (e.g. 1000) vs threads (10), we might want to log-scale or just show it accurately.
        // Let's use a dual-bar approach or just separate metrics? 
        // User asked for "thread vs heads chart". Stick to Pie but fix data visibility.
        // To make it "visible", we ensure we have data points.

        const arr = [];
        if (t > 0 || h > 0) {
            arr.push({ name: 'Threads', value: t, fill: '#06b6d4' });
            arr.push({ name: 'Handles', value: h, fill: '#8b5cf6' });
        }

        return arr.length ? arr : [{ name: 'No Data', value: 1, fill: '#334155' }];
    }, [details]);

    useEffect(() => {
        if (selectedPid) {
            fetchDetails(selectedPid);
        } else {
            setDetails(null);
        }
    }, [selectedPid]);

    const fetchDetails = async (pid) => {
        setLoadingDetails(true);
        try {
            const res = await fetchWithTimeout(`${API_BASE}/${pid}/details`, {}, 15000);
            const json = await res.json();
            if (json.success) {
                setDetails(json.data);
            } else {
                // Determine fallback if API fails but we want to show *something*
                setDetails({ threads: 0, handles: 0, ctx_switches: 0, username: 'Unknown' });
            }
        } catch (e) {
            console.error(e);
            if (!isConnected) showBackendOffline();
            // detailed error state instead of silent failure
            setDetails({ error: true, message: e.name === 'AbortError' ? 'Request Timed Out — Server Busy' : (e.message || 'Failed to fetch') });
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleAction = async (action, body = null) => {
        if (!selectedPid) return;
        try {
            const opts = { method: 'POST' };
            if (body) {
                opts.headers = { 'Content-Type': 'application/json' };
                opts.body = JSON.stringify(body);
            }

            const res = await fetch(`${API_BASE}/${selectedPid}/${action}`, opts);
            const json = await res.json();

            if (json.success) {
                setActionMsg({ type: 'success', text: json.message });
                // If API returned updated data for the process, apply to overrides immediately
                if (json.data && typeof json.data === 'object') {
                    setOverrides(prev => ({ ...prev, [selectedPid]: { ...(prev[selectedPid] || {}), ...json.data } }));
                } else {
                    // Refresh details to get authoritative state
                    fetchDetails(selectedPid);
                }
            } else {
                setActionMsg({ type: 'error', text: json.message });
            }
            setTimeout(() => setActionMsg(null), 1500);
            return json.success === true;
        } catch (e) {
            console.error(e);
            if (!isConnected) showBackendOffline();
            else setActionMsg({ type: 'error', text: "Request failed" });
            setTimeout(() => setActionMsg(null), 1500);
            return false;
        }
    };

    const toggleCore = async (coreIndex) => {
        if (!displayedProcess) return;

        // Default to all cores if affinity is null (meaning all allowed)
        let currentAffinity = displayedProcess.cpu_affinity;
        if (!currentAffinity) {
            currentAffinity = Array.from({ length: cpuCount }, (_, i) => i);
        }

        let newAffinity;
        if (currentAffinity.includes(coreIndex)) {
            newAffinity = currentAffinity.filter(c => c !== coreIndex);
        } else {
            newAffinity = [...currentAffinity, coreIndex];
        }

        // Prevent detaching from ALL cores
        if (newAffinity.length === 0) return;

        updateAffinity(newAffinity, currentAffinity);
    };

    const resetAffinity = async () => {
        if (!displayedProcess) return;
        const allCores = Array.from({ length: cpuCount }, (_, i) => i);
        const currentAffinity = displayedProcess.cpu_affinity || allCores;
        updateAffinity(allCores, currentAffinity);
    };

    const updateAffinity = async (newAffinity, oldAffinity) => {
        // Optimistic UI update
        setOverrides(prevMap => ({ ...prevMap, [selectedPid]: { ...(prevMap[selectedPid] || {}), cpu_affinity: newAffinity } }));
        const ok = await handleAction('affinity', { cores: newAffinity });
        if (!ok) {
            // revert
            setOverrides(prevMap => {
                const copy = { ...prevMap };
                copy[selectedPid] = { ...(copy[selectedPid] || {}), cpu_affinity: oldAffinity };
                return copy;
            });
        }
    };

    return (
        <div className="flex h-full gap-6">
            {/* Left: Process List + System CPU chart */}
            <div className="w-1/3 glass-panel flex flex-col p-4">
                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <Layers size={20} className="text-cyan-400" /> Processes
                </h2>
                {cpuCoresData.length > 0 && (
                    <div className="mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <h3 className="text-xs font-semibold text-slate-400 mb-2">System CPU cores</h3>
                        <ResponsiveContainer width="100%" height={120}>
                            <BarChart data={cpuCoresData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <XAxis dataKey="core" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} width={24} stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', fontSize: 11 }} formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Usage']} />
                                <Bar dataKey="usage" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
                <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                    {processes.map(p => (
                        <div
                            key={p.pid}
                            onClick={() => setSelectedPid(p.pid)}
                            className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedPid === p.pid
                                ? 'bg-sky-500/20 border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.15)]' // Soothing Sky Blue
                                : 'bg-slate-800/50 border-transparent hover:bg-sky-500/10'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className={`font-medium truncate ${selectedPid === p.pid ? 'text-white' : 'text-slate-200'}`}>{p.name}</span>
                                <span className={`text-xs font-mono ${selectedPid === p.pid ? 'text-sky-300' : 'text-slate-500'}`}>{p.pid}</span>
                            </div>
                            <div className="flex justify-between mt-1 text-xs">
                                <span className={p.status === 'running' ? 'text-green-400' : 'text-orange-400'}>
                                    {p.status}
                                </span>
                                <span className={selectedPid === p.pid ? 'text-sky-200' : 'text-slate-400'}>CPU: {p.cpu_percent.toFixed(1)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Inspector */}
            <div className="flex-1 flex flex-col">
                {displayedProcess ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={selectedPid}
                        className="glass-panel p-6 h-full flex flex-col overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6 border-b border-slate-700/50 pb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-1">{displayedProcess?.name}</h1>
                                <div className="flex gap-4 text-sm text-slate-400">
                                    <span className="flex items-center gap-1"><Hash size={14} /> PID: {selectedPid}</span>
                                    <span className="flex items-center gap-1"><Cpu size={14} /> Core: {displayedProcess?.cpu_affinity ? displayedProcess.cpu_affinity.length : cpuCount} / {cpuCount}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        // optimistic
                                        setOverrides(prev => ({ ...prev, [selectedPid]: { ...(prev[selectedPid] || {}), status: 'stopped' } }));
                                        const ok = await handleAction('suspend');
                                        if (!ok) {
                                            // revert to actual selectedProcess.status
                                            setOverrides(prev => ({ ...prev, [selectedPid]: { ...(prev[selectedPid] || {}), status: selectedProcess?.status } }));
                                        }
                                    }}
                                    className="p-2 bg-slate-800 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors border border-slate-700"
                                    title="Suspend"
                                >
                                    <Pause size={20} />
                                </button>
                                <button
                                    onClick={async () => {
                                        setOverrides(prev => ({ ...prev, [selectedPid]: { ...(prev[selectedPid] || {}), status: 'running' } }));
                                        const ok = await handleAction('resume');
                                        if (!ok) {
                                            setOverrides(prev => ({ ...prev, [selectedPid]: { ...(prev[selectedPid] || {}), status: selectedProcess?.status } }));
                                        }
                                    }}
                                    className="p-2 bg-slate-800 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors border border-slate-700"
                                    title="Resume"
                                >
                                    <Play size={20} />
                                </button>
                            </div>
                        </div>

                        {actionMsg && (
                            <div className={`mb-4 p-3 rounded-lg text-sm ${actionMsg.type === 'success' ? 'bg-green-500/20 text-green-300' : actionMsg.text.toLowerCase().includes('access denied') ? 'bg-amber-500/20 text-amber-200' : 'bg-red-500/20 text-red-300'}`}>
                                {actionMsg.text.toLowerCase().includes('access denied')
                                    ? 'System process protected. Run as Admin to modify.'
                                    : actionMsg.text}
                            </div>
                        )}

                        {/* Scheduling Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Affinity */}
                            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                                        <Cpu size={18} /> CPU Affinity
                                    </h3>
                                    <button
                                        onClick={resetAffinity}
                                        className="text-[10px] px-2 py-1 bg-slate-700/50 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 rounded transition-colors"
                                    >
                                        RESET ALL
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mb-3">Bind this process to specific physical cores.</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {Array.from({ length: cpuCount }).map((_, i) => {
                                        const isActive = !displayedProcess?.cpu_affinity || displayedProcess.cpu_affinity.includes(i);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => toggleCore(i)}
                                                className={`h-8 rounded text-xs font-mono transition-all ${isActive
                                                    ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                                    : 'bg-slate-700 text-slate-400 opacity-50'
                                                    }`}
                                            >
                                                C{i}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                                <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                                    <Activity size={18} /> Scheduling Priority
                                </h3>
                                <p className="text-xs text-slate-500 mb-3">Adjust how aggressively the OS schedules this task.</p>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                                    value={displayedProcess?.priority || 'normal'}
                                    onChange={async (e) => {
                                        const val = e.target.value;
                                        const prev = displayedProcess?.priority;
                                        setOverrides(prevMap => ({ ...prevMap, [selectedPid]: { ...(prevMap[selectedPid] || {}), priority: val } }));
                                        const ok = await handleAction('priority', { priority: val });
                                        if (!ok) {
                                            setOverrides(prevMap => ({ ...prevMap, [selectedPid]: { ...(prevMap[selectedPid] || {}), priority: prev } }));
                                        }
                                    }}
                                >
                                    <option value="idle">Idle (Lowest)</option>
                                    <option value="below_normal">Below Normal</option>
                                    <option value="normal">Normal</option>
                                    <option value="above_normal">Above Normal</option>
                                    <option value="high">High</option>
                                    <option value="realtime">Realtime (Dangerous)</option>
                                </select>
                            </div>
                        </div>

                        {/* Detailed Stats */}
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-emerald-400 mb-3">Detailed Inspection</h3>
                            {loadingDetails ? (
                                <div className="flex items-center gap-2 text-slate-500 italic">
                                    <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                                    Scanning process memory pages...
                                </div>
                            ) : details ? (
                                <>
                                    {/* Chart always visible if details loaded, even with 0s */}
                                    <div className="mb-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex flex-col gap-4 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-semibold text-slate-400">Threads vs Handles</h4>
                                            {details.threads === 0 && details.handles === 0 && (
                                                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">Restricted</span>
                                            )}
                                        </div>

                                        {details.error ? (
                                            <div className="flex flex-col items-center justify-center py-6 text-slate-500 gap-2">
                                                <div className="p-3 bg-red-500/10 rounded-full">
                                                    <ShieldCheck size={24} className="text-red-400" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-medium text-slate-400">Connection Failed</p>
                                                    <p className="text-xs text-red-400 max-w-[200px]">{details.message}</p>
                                                </div>
                                            </div>
                                        ) : details.threads === 0 && details.handles === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-6 text-slate-500 gap-2">
                                                <div className="p-3 bg-slate-800 rounded-full">
                                                    <ShieldCheck size={24} className="text-slate-600" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-medium text-slate-400">Access Restricted</p>
                                                    <p className="text-xs text-slate-600 max-w-[200px]">System process details are protected. Run as Admin to view.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                                <div className="flex-shrink-0" style={{ width: 140, height: 140 }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                                            <Pie
                                                                data={processStatsPieData}
                                                                dataKey="value"
                                                                nameKey="name"
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={38}
                                                                outerRadius={52}
                                                                paddingAngle={2}
                                                            >
                                                                {processStatsPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                                            </Pie>
                                                            <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="flex flex-col justify-center gap-1 flex-1 min-w-0">
                                                    {processStatsPieData.map((e, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <span className="rounded-full w-2 h-2 flex-shrink-0" style={{ backgroundColor: e.fill }} />
                                                            <div className="flex flex-col">
                                                                <span className="text-slate-300 text-xs truncate font-medium">{e.name}</span>
                                                                <span className="text-slate-500 text-[10px]">{e.value.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <StatBox label="Threads" value={details.threads} />
                                        <StatBox label="Handles" value={details.handles} />
                                        <StatBox label="Context Switches" value={typeof details.ctx_switches === 'number' ? details.ctx_switches.toLocaleString() : details.ctx_switches} />
                                        <StatBox label="User" value={details.username || '—'} />
                                        <StatBox label="Create Time" value={details.create_time ? new Date(details.create_time * 1000).toLocaleTimeString() : '—'} />
                                    </div>
                                </>
                            ) : (
                                <div className="text-slate-500">Select a process to inspect details</div>
                            )}
                        </div>

                    </motion.div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-4">
                        <Layers size={64} className="opacity-20" />
                        <p>Select a process from the left to inspect internals</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatBox({ label, value }) {
    return (
        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider">{label}</div>
            <div className="text-slate-200 font-mono text-lg truncate" title={value}>{value}</div>
        </div>
    );
}
export default KernelLab;