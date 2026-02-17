import { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { MetricsContext } from '../App';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Pause, Play, XOctagon, GitBranch, Info, GitFork, Zap, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const API_BASE = "http://127.0.0.1:8000/api/process";

// helper: fetch with timeout (increased default for reliability)
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

// helper: fetch with retries and exponential backoff
async function retryFetch(url, opts = {}, timeout = 15000, maxRetries = 2) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetchWithTimeout(url, opts, timeout);
            return res;
        } catch (e) {
            lastError = e;
            // Only retry on network errors (AbortError = timeout, TypeError = network fail)
            if (e.name !== 'AbortError' && e.name !== 'TypeError') {
                throw e;
            }
            // Wait before retry with exponential backoff
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            }
        }
    }
    throw lastError;
}

const PRIORITY_OPTIONS = [
    { value: 'idle', label: 'Idle' },
    { value: 'below_normal', label: 'Below Normal' },
    { value: 'normal', label: 'Normal' },
    { value: 'above_normal', label: 'Above Normal' },
    { value: 'high', label: 'High' },
    { value: 'realtime', label: 'Realtime' },
];
const PRIORITY_COLORS = {
    idle: 'bg-gray-200 text-gray-800',
    below_normal: 'bg-sky-100 text-sky-700',
    normal: 'bg-sky-500 text-white',
    above_normal: 'bg-indigo-500 text-white',
    high: 'bg-amber-500 text-white',
    realtime: 'bg-rose-600 text-white'
};

// (Previously used to block protected processes; no longer blocking client-side)
const PROTECTED_NAMES = ['system idle process', 'system', 'spotify', 'settings', 'explorer', 'svchost', 'wininit', 'winlogon'];

function formatStatus(status) {
    if (!status) return '—';
    const s = String(status).toLowerCase();
    if (s === 'running') return 'Running';
    if (s === 'sleeping') return 'Sleeping';
    if (s === 'zombie') return 'Zombie';
    if (s === 'stopped') return 'Stopped';
    return status;
}

function ProcessTreeRow({ node, depth }) {
    const [open, setOpen] = useState(!!(node.children && node.children.length > 0));
    const hasChildren = node.children && node.children.length > 0;
    return (
        <div className="select-none">
            <div
                className="flex items-center gap-2 py-1 hover:bg-slate-700/30 rounded px-1 -mx-1 cursor-pointer"
                style={{ paddingLeft: depth * 16 }}
                onClick={() => hasChildren && setOpen(o => !o)}
            >
                {hasChildren ? <span className="text-slate-500 w-4">{open ? '▼' : '▶'}</span> : <span className="w-4" />}
                <span className="text-cyan-400">PID {node.pid}</span>
                <span className="text-slate-300 truncate flex-1" title={node.name}>{node.name}</span>
                <span className="text-slate-500 text-xs">{node.status}</span>
            </div>
            {open && hasChildren && node.children.map((child) => (
                <ProcessTreeRow key={child.pid} node={child} depth={depth + 1} />
            ))}
        </div>
    );
}

function Processes() {
    const { data, isConnected } = useContext(MetricsContext);
    const connAlertRef = useRef(0);
    const CONN_COOLDOWN = 10000; // 10s throttle for showing backend offline message

    const showBackendOffline = (pid) => {
        const now = Date.now();
        if (now - connAlertRef.current > CONN_COOLDOWN) {
            setActionStatus({ pid, msg: "Backend offline — start the API server (run run-dev.ps1 or python run_dev.py)", type: 'error' });
            connAlertRef.current = now;
            setTimeout(() => setActionStatus(null), 3000);
        }
    };
    const [search, setSearch] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'power_score', direction: 'desc' });
    const [actionStatus, setActionStatus] = useState(null);
    const [pendingActions, setPendingActions] = useState({});
    const [processOverrides, setProcessOverrides] = useState({});
    const [removedPids, setRemovedPids] = useState([]);
    const [detailsModal, setDetailsModal] = useState(null);
    const [treeModal, setTreeModal] = useState(null); // { pid, name, tree }
    const [cpuPieActiveIndex, setCpuPieActiveIndex] = useState(-1);
    const [memPieActiveIndex, setMemPieActiveIndex] = useState(-1);
    const [flashingPids, setFlashingPids] = useState({}); // Track PIDs whose Nice column should flash
    // Queue actions when backend is offline; they'll run automatically once WS reconnects
    const actionQueueRef = useRef([]);

    // Flush queued actions when backend comes online
    useEffect(() => {
        if (!isConnected || actionQueueRef.current.length === 0) return;
        let cancelled = false;
        (async () => {
            while (actionQueueRef.current.length && !cancelled) {
                const fn = actionQueueRef.current.shift();
                try {
                    await fn();
                } catch (e) {
                    console.error('queued action failed:', e);
                }
                // small gap between queued actions to avoid spamming backend
                await new Promise(r => setTimeout(r, 250));
            }
        })();
        return () => { cancelled = true; };
    }, [isConnected]);

    if (!data) return null;

    const fetchTree = async (pid, name) => {
        // mark pending
        setPendingActions(prev => ({ ...prev, [pid]: true }));
        try {
            const res = await retryFetch(`${API_BASE}/tree?root=${pid}`, {}, 8000, 2);
            const json = await res.json();
            // Accept both legacy { tree } and new { success, tree } shapes
            const tree = json?.tree ?? (json.success ? json.tree : null);
            if (tree && tree.length > 0) {
                setTreeModal({ pid, name, tree: tree[0] });
            } else if (json && json.success === false) {
                // Backend returned error (e.g., access denied)
                setActionStatus({ pid, msg: `Failed to load process tree: ${json.message || 'unknown'}`, type: 'error' });
                setTimeout(() => setActionStatus(null), 3000);
                setTreeModal({ pid, name, tree: null });
            } else {
                // Empty result
                setTreeModal({ pid, name, tree: null });
            }
        } catch (err) {
            console.error('fetchTree error:', err);
            const errMsg = err.name === 'AbortError' ? 'Request timed out — server is busy, please wait...' : 'Failed to connect to backend';
            setActionStatus({ pid, msg: errMsg, type: 'error' });
            setTimeout(() => setActionStatus(null), 3000);
            setTreeModal({ pid, name, tree: null });
        } finally {
            setPendingActions(prev => {
                const copy = { ...prev };
                delete copy[pid];
                return copy;
            });
        }
    };

    const handleAction = async (pid, action, name) => {
        if (action === 'kill' || action === 'force-kill') {
            // Stronger confirmation for potentially dangerous processes (browsers / critical)
            const lower = String(name || '').toLowerCase();
            const riskyKeywords = ['chrome', 'chromium', 'msedge', 'edge', 'firefox', 'opera', 'brave', 'safari', 'explorer', 'system', 'svchost'];
            const isRisky = riskyKeywords.some(k => lower.includes(k));
            const actionType = action === 'force-kill' ? 'FORCE KILL' : 'TERMINATE';
            const baseMsg = `Are you sure you want to ${actionType} process "${name}" (PID: ${pid})?${action === 'force-kill' ? '\n\n⚡ Force Kill will instantly close the window with NO chance to save data!' : '\nUnsaved data may be lost.'}`;
            const warnMsg = isRisky ? `\n\nWarning: This looks like a browser or system process. Killing it may crash your browser or the system UI.` : '';
            if (!window.confirm(baseMsg + warnMsg)) {
                return;
            }
        }
        setPendingActions(prev => ({ ...prev, [pid]: true }));
        try {
            const actionTimeout = (action === 'kill' || action === 'force-kill' ? 10000 : 8000);
            const res = await retryFetch(`${API_BASE}/${pid}/${action}`, { method: 'POST' }, actionTimeout, 2);
            const json = await res.json();

            if (json.success) {
                const verb = action === 'force-kill' ? 'Force killed' : action === 'kill' ? 'Terminated' : action === 'suspend' ? 'Suspended' : 'Resumed';
                setActionStatus({ pid, msg: `${verb} successfully`, type: 'success' });
                if (action === 'kill' || action === 'force-kill') {
                    // Hide the row immediately until websocket updates arrive
                    setRemovedPids(prev => (prev.includes(pid) ? prev : [...prev, pid]));
                    // close related modals if any
                    if (detailsModal?.pid === pid) setDetailsModal(null);
                    if (treeModal?.pid === pid) setTreeModal(null);
                } else if (json.data) {
                    // update local override so table reflects immediate change
                    setProcessOverrides(prev => ({ ...prev, [pid]: { ...(prev[pid] || {}), ...json.data } }));
                }
            } else {
                // If kill failed with "not found", suggest using kill tree
                let errorMsg = `Failed: ${json.message || 'unknown'}`;
                if (action === 'kill' && json.message && json.message.toLowerCase().includes('not found')) {
                    errorMsg = 'Process not found — try "Kill Tree" for multi-process apps';
                }
                setActionStatus({ pid, msg: errorMsg, type: 'error' });
            }
            setTimeout(() => setActionStatus(null), 3000);
        } catch (err) {
            console.error(err);
            const errMsg = err.name === 'AbortError' ? 'Request timed out — server is busy, please wait...' : 'Failed to connect to backend';
            setActionStatus({ pid, msg: errMsg, type: 'error' });
            setTimeout(() => setActionStatus(null), 3000);
        } finally {
            setPendingActions(prev => {
                const copy = { ...prev };
                delete copy[pid];
                return copy;
            });
        }
    };

    const handleKillTree = async (pid, name) => {
        if (!window.confirm(`Terminate process "${name}" (PID: ${pid}) and ALL its child processes?`)) return;
        setPendingActions(prev => ({ ...prev, [pid]: true }));
        try {
            const res = await retryFetch(`${API_BASE}/${pid}/kill-tree`, { method: 'POST' }, 20000, 2);
            const json = await res.json();
            if (json.success) {
                setActionStatus({ pid, msg: json.message, type: 'success' });
                if (json.data) setProcessOverrides(prev => ({ ...prev, [pid]: { ...(prev[pid] || {}), ...json.data } }));
                // also hide the root process row immediately
                setRemovedPids(prev => (prev.includes(pid) ? prev : [...prev, pid]));
            } else {
                setActionStatus({ pid, msg: `Failed: ${json.message || 'unknown'}`, type: 'error' });
            }
            setTimeout(() => setActionStatus(null), 2000);
        } catch (err) {
            console.error(err);
            const errMsg = err.name === 'AbortError' ? 'Request timed out — server is busy, please wait...' : 'Failed to connect to backend';
            setActionStatus({ pid, msg: errMsg, type: 'error' });
            setTimeout(() => setActionStatus(null), 3000);
        } finally {
            setPendingActions(prev => {
                const copy = { ...prev };
                delete copy[pid];
                return copy;
            });
        }
    };

    const handleForceKillTree = async (pid, name) => {
        if (!window.confirm(`⚡ FORCE KILL process "${name}" (PID: ${pid}) and ALL its children?\n\nThis will INSTANTLY terminate all processes with no chance to save data!\n\nUse this for resistant browsers like Edge.`)) return;
        setPendingActions(prev => ({ ...prev, [pid]: true }));
        try {
            const res = await retryFetch(`${API_BASE}/${pid}/force-kill-tree`, { method: 'POST' }, 20000, 2);
            const json = await res.json();
            if (json.success) {
                setActionStatus({ pid, msg: json.message, type: 'success' });
                setRemovedPids(prev => (prev.includes(pid) ? prev : [...prev, pid]));
                if (detailsModal?.pid === pid) setDetailsModal(null);
                if (treeModal?.pid === pid) setTreeModal(null);
            } else {
                setActionStatus({ pid, msg: `Failed: ${json.message || 'unknown'}`, type: 'error' });
            }
            setTimeout(() => setActionStatus(null), 2000);
        } catch (err) {
            console.error(err);
            const errMsg = err.name === 'AbortError' ? 'Request timed out — server is busy, please wait...' : 'Failed to connect to backend';
            setActionStatus({ pid, msg: errMsg, type: 'error' });
            setTimeout(() => setActionStatus(null), 3000);
        } finally {
            setPendingActions(prev => {
                const copy = { ...prev };
                delete copy[pid];
                return copy;
            });
        }
    };

    const handleSetPriority = async (pid, priority) => {
        setPendingActions(prev => ({ ...prev, [pid]: true }));
        try {
            const res = await retryFetch(`${API_BASE}/${pid}/priority`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority }),
            }, 8000, 2);
            const json = await res.json();
            if (json.success) {
                setActionStatus({ pid, msg: `Priority set to ${priority}`, type: 'success' });
                if (json.data) setProcessOverrides(prev => ({ ...prev, [pid]: { ...(prev[pid] || {}), ...json.data } }));
                // Flash the Nice Level column
                setFlashingPids(prev => ({ ...prev, [pid]: true }));
                setTimeout(() => setFlashingPids(prev => { const copy = { ...prev }; delete copy[pid]; return copy; }), 1500);
            } else {
                setActionStatus({ pid, msg: `Failed: ${json.message || 'unknown'}`, type: 'error' });
            }
            setTimeout(() => setActionStatus(null), 2000);
        } catch (err) {
            console.error(err);
            const errMsg = err.name === 'AbortError' ? 'Request timed out — server is busy, please wait...' : 'Failed to connect to backend';
            setActionStatus({ pid, msg: errMsg, type: 'error' });
            setTimeout(() => setActionStatus(null), 3000);
        } finally {
            setPendingActions(prev => {
                const copy = { ...prev };
                delete copy[pid];
                return copy;
            });
        }
    };

    const fetchDetails = async (pid, name) => {
        setPendingActions(prev => ({ ...prev, [pid]: true }));
        try {
            const res = await retryFetch(`${API_BASE}/${pid}/details`, {}, 8000, 2);
            const json = await res.json();
            if (json.success) setDetailsModal({ pid, name, data: json.data });
            else {
                setActionStatus({ pid, msg: `Could not load details: ${json.message || ''}`, type: 'error' });
                setTimeout(() => setActionStatus(null), 3000);
            }
        } catch (err) {
            console.error(err);
            const errMsg = err.name === 'AbortError' ? 'Request timed out — server is busy, please wait...' : 'Failed to fetch details';
            setActionStatus({ pid, msg: errMsg, type: 'error' });
            setTimeout(() => setActionStatus(null), 3000);
        } finally {
            setPendingActions(prev => {
                const copy = { ...prev };
                delete copy[pid];
                return copy;
            });
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredProcs = data.processes
        .map(p => ({ ...p, ...(processOverrides[p.pid] || {}) })) // apply overrides
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        .filter(p => !removedPids.includes(p.pid))
        .sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    const topN = 8;
    const cpuPieData = useMemo(() => {
        const sorted = [...(data.processes || [])].sort((a, b) => (b.cpu_percent || 0) - (a.cpu_percent || 0));
        const top = sorted.slice(0, topN).map(p => ({ name: (p.name || '').replace(/\.[^.]+$/, '') || '?', value: Number(p.cpu_percent) || 0 }));
        const rest = sorted.slice(topN).reduce((s, p) => s + (Number(p.cpu_percent) || 0), 0);
        if (rest > 0) top.push({ name: 'Others', value: rest });
        return top.filter(d => d.value > 0);
    }, [data.processes]);

    const memPieData = useMemo(() => {
        const sorted = [...(data.processes || [])].sort((a, b) => (b.memory_percent || 0) - (a.memory_percent || 0));
        const top = sorted.slice(0, topN).map(p => ({ name: (p.name || '').replace(/\.[^.]+$/, '') || '?', value: Number(p.memory_percent) || 0 }));
        const rest = sorted.slice(topN).reduce((s, p) => s + (Number(p.memory_percent) || 0), 0);
        if (rest > 0) top.push({ name: 'Others', value: rest });
        return top.filter(d => d.value > 0);
    }, [data.processes]);

    const topCpuBarData = useMemo(() =>
        [...(data.processes || [])]
            .sort((a, b) => (b.cpu_percent || 0) - (a.cpu_percent || 0))
            .slice(0, 10)
            .map(p => ({ name: (p.name || '').replace(/\.[^.]+$/, '') || '?', cpu: Number(p.cpu_percent) || 0, mem: Number(p.memory_percent) || 0 })),
        [data.processes]
    );

    const PIE_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#64748b'];

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                    Process Monitor
                    {actionStatus && (
                        <span className={`text-sm font-normal px-3 py-1 rounded-full ${actionStatus.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {actionStatus.msg}
                        </span>
                    )}
                </h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search processes..."
                        className="bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors w-64"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="glass-panel p-4 rounded-xl flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">CPU share (top processes)</h3>
                    {cpuPieData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                                    <Pie
                                        data={cpuPieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={52}
                                        outerRadius={78}
                                        paddingAngle={2}
                                        activeIndex={cpuPieActiveIndex}
                                        activeShape={{ outerRadius: 84, strokeWidth: 2, stroke: '#94a3b8' }}
                                        onMouseEnter={(_, i) => setCpuPieActiveIndex(i)}
                                        onMouseLeave={() => setCpuPieActiveIndex(-1)}
                                    >
                                        {cpuPieData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, 'CPU']} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 justify-center" style={{ fontSize: 9 }}>
                                {cpuPieData.map((d, i) => (
                                    <span key={i} className="flex items-center gap-1 text-slate-400">
                                        <span className="rounded-full w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                        <span className="truncate max-w-[72px]" title={d.name}>{d.name}</span>
                                    </span>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No data</div>
                    )}
                </div>
                <div className="glass-panel p-4 rounded-xl flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Memory share (top processes)</h3>
                    {memPieData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                                    <Pie
                                        data={memPieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={52}
                                        outerRadius={78}
                                        paddingAngle={2}
                                        activeIndex={memPieActiveIndex}
                                        activeShape={{ outerRadius: 84, strokeWidth: 2, stroke: '#94a3b8' }}
                                        onMouseEnter={(_, i) => setMemPieActiveIndex(i)}
                                        onMouseLeave={() => setMemPieActiveIndex(-1)}
                                    >
                                        {memPieData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Mem']} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 justify-center" style={{ fontSize: 9 }}>
                                {memPieData.map((d, i) => (
                                    <span key={i} className="flex items-center gap-1 text-slate-400">
                                        <span className="rounded-full w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                        <span className="truncate max-w-[72px]" title={d.name}>{d.name}</span>
                                    </span>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No data</div>
                    )}
                </div>
                <div className="glass-panel p-4 rounded-xl">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Top 10 by CPU %</h3>
                    {topCpuBarData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={topCpuBarData} layout="vertical" margin={{ top: 0, right: 20, left: 50, bottom: 0 }}>
                                <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                                <YAxis type="category" dataKey="name" width={48} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} formatter={(v) => [`${Number(v).toFixed(1)}%`, 'CPU']} />
                                <Bar dataKey="cpu" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No data</div>
                    )}
                </div>
            </div>

            <div className="glass-panel overflow-hidden flex flex-col flex-1">
                <div className="overflow-y-auto flex-1 p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-md z-10">
                            <tr className="text-slate-400 text-sm border-b border-slate-700/50">
                                <th className="p-4 font-medium cursor-pointer hover:text-slate-200" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">Process Name {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-50" />}</div>
                                </th>
                                <th className="p-4 font-medium text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('pid')}>
                                    <div className="flex items-center gap-1 justify-end">PID {sortConfig.key === 'pid' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-50" />}</div>
                                </th>
                                <th className="p-4 font-medium text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('cpu_percent')}>
                                    <div className="flex items-center gap-1 justify-end">CPU % {sortConfig.key === 'cpu_percent' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-50" />}</div>
                                </th>
                                <th className="p-4 font-medium text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('memory_percent')}>
                                    <div className="flex items-center gap-1 justify-end">Mem % {sortConfig.key === 'memory_percent' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-50" />}</div>
                                </th>
                                <th className="p-4 font-medium text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-1 justify-end">State</div>
                                </th>
                                <th className="p-4 font-medium text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('num_threads')}>
                                    <div className="flex items-center gap-1 justify-end">Threads</div>
                                </th>
                                <th className="p-4 font-medium text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('nice_level')}>
                                    <div className="flex items-center gap-1 justify-end">Nice</div>
                                </th>
                                <th className="p-4 font-medium text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('power_score')}>
                                    <div className="flex items-center gap-1 justify-end">Power Score {sortConfig.key === 'power_score' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-50" />}</div>
                                </th>
                                <th className="p-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {filteredProcs.map((proc) => (
                                    <motion.tr
                                        key={proc.pid}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="border-b border-slate-700/30 hover:bg-sky-500/10 transition-colors group"
                                    >
                                        <td className="p-4 font-medium text-slate-200 truncate max-w-[140px]" title={proc.name}>{proc.name}</td>
                                        <td className="p-4 text-right text-slate-500 font-mono text-sm">{proc.pid}</td>
                                        <td className="p-4 text-right text-cyan-400 font-mono">{Number(proc.cpu_percent).toFixed(1)}%</td>
                                        <td className="p-4 text-right text-yellow-400 font-mono">{Number(proc.memory_percent).toFixed(1)}%</td>
                                        <td className="p-4 text-right text-slate-400 text-xs">{formatStatus(proc.status)}</td>
                                        <td className="p-4 text-right text-slate-400 font-mono text-sm">{proc.num_threads ?? '—'}</td>
                                        <td className="p-4 text-right text-slate-400 font-mono text-sm">{proc.nice_level ?? '—'}</td>
                                        <td className="p-4 text-right text-red-400 font-bold">{Number(proc.power_score).toFixed(1)}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center justify-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                {/* Row 1: Details, Process Tree, Suspend, Resume */}
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => fetchDetails(proc.pid, proc.name)}
                                                        disabled={!!pendingActions[proc.pid]}
                                                        className={`p-1.5 rounded-lg bg-slate-500/10 text-slate-400 transition-colors ${pendingActions[proc.pid] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-500 hover:text-white'}`}
                                                        title="Details"
                                                    >
                                                        <Info size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => fetchTree(proc.pid, proc.name)}
                                                        disabled={!!pendingActions[proc.pid]}
                                                        className={`p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 transition-colors ${pendingActions[proc.pid] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-500 hover:text-white'}`}
                                                        title="View process tree"
                                                    >
                                                        <GitFork size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(proc.pid, 'suspend', proc.name)}
                                                        disabled={!!pendingActions[proc.pid]}
                                                        className={`p-1.5 rounded-lg bg-orange-500/10 text-orange-400 transition-colors ${pendingActions[proc.pid] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-500 hover:text-white'}`}
                                                        title="Suspend"
                                                    >
                                                        <Pause size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(proc.pid, 'resume', proc.name)}
                                                        disabled={!!pendingActions[proc.pid]}
                                                        className={`p-1.5 rounded-lg bg-green-500/10 text-green-400 transition-colors ${pendingActions[proc.pid] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500 hover:text-white'}`}
                                                        title="Resume"
                                                    >
                                                        <Play size={14} />
                                                    </button>
                                                </div>
                                                {/* Row 2: Priority and Kill */}
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <select
                                                        className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                                                        value={proc.priority || processOverrides[proc.pid]?.priority || ''}
                                                        onChange={(e) => { const v = e.target.value; if (v) handleSetPriority(proc.pid, v); }}
                                                        title="Set priority"
                                                        disabled={!!pendingActions[proc.pid]}
                                                    >
                                                        <option value="">Priority</option>
                                                        {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                    </select>
                                                    <button
                                                        onClick={() => handleKillTree(proc.pid, proc.name)}
                                                        disabled={!!pendingActions[proc.pid]}
                                                        className={`p-1.5 rounded-lg bg-red-500/10 text-red-400 transition-colors ${pendingActions[proc.pid] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500 hover:text-white'}`}
                                                        title="Kill process + children"
                                                    >
                                                        <GitBranch size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                    {filteredProcs.length === 0 && (
                        <div className="p-8 text-center text-slate-500">No processes found matching &quot;{search}&quot;</div>
                    )}
                </div>
            </div>

            {/* Process tree modal */}
            {
                treeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setTreeModal(null)}>
                        <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800">Process tree: {treeModal.name} (PID {treeModal.pid})</h3>
                                <button className="text-slate-600 hover:text-slate-900 text-xl leading-none" onClick={() => setTreeModal(null)}>×</button>
                            </div>
                            <div className="p-4 overflow-y-auto max-h-[60vh] text-sm font-mono text-slate-800">
                                {treeModal.tree ? (
                                    <ProcessTreeRow node={treeModal.tree} depth={0} />
                                ) : (
                                    <p className="text-slate-500">No tree data.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Process details modal */}
            {
                detailsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDetailsModal(null)}>
                        <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800">Process: {detailsModal.name} (PID {detailsModal.pid})</h3>
                                <button className="text-slate-600 hover:text-slate-900" onClick={() => setDetailsModal(null)}>✕</button>
                            </div>
                            <div className="p-4 overflow-y-auto max-h-[60vh] text-sm space-y-3 text-slate-800">
                                {detailsModal.data && (
                                    <>
                                        <p><span className="text-slate-500">Status:</span> <span className="font-medium">{detailsModal.data.status ?? '—'}</span></p>
                                        <p><span className="text-slate-500">Threads:</span> <span className="font-mono">{detailsModal.data.threads ?? '—'}</span></p>
                                        <p><span className="text-slate-500">Nice:</span> <span className="font-mono">{detailsModal.data.nice ?? '—'}</span></p>
                                        <p><span className="text-slate-500">Username:</span> <span className="font-mono">{detailsModal.data.username ?? '—'}</span></p>
                                        <p><span className="text-slate-500">Context switches:</span> <span className="font-mono">{detailsModal.data.ctx_switches ?? '—'}</span></p>
                                        {detailsModal.data.open_files && detailsModal.data.open_files.length > 0 && (
                                            <div>
                                                <p className="text-slate-500 mb-1">Open files (first 30):</p>
                                                <ul className="list-disc list-inside text-slate-700 text-xs space-y-0.5 max-h-32 overflow-y-auto">
                                                    {detailsModal.data.open_files.map((f, i) => <li key={i} className="truncate" title={f.path}>{f.path}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default Processes;