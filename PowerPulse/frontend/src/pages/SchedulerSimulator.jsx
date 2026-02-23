import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    AreaChart, Area, LineChart, Line, Legend, ScatterChart, Scatter, ZAxis, ComposedChart
} from 'recharts';
import {
    Cpu, Play, RotateCcw, Plus, Trash2, Info, Clock, Activity,
    Zap, ArrowRight, Layers, Timer, BarChart3, AlertTriangle, Settings,
    PieChart as PieChartIcon, TrendingUp, Target, Radar as RadarIcon, GitBranch, Combine
} from 'lucide-react';

const ALGORITHMS = {
    fcfs: { name: 'First Come First Serve (FCFS)', description: 'Processes execute in arrival order. Non-preemptive.', complexity: 'O(n)', preemptive: false },
    sjf: { name: 'Shortest Job First (SJF)', description: 'Shortest burst time executes first. Non-preemptive.', complexity: 'O(n log n)', preemptive: false },
    srtf: { name: 'Shortest Remaining Time First', description: 'Preemptive version of SJF. Switches to shorter job.', complexity: 'O(n log n)', preemptive: true },
    rr: { name: 'Round Robin (RR)', description: 'Each process gets a fixed time quantum. Preemptive.', complexity: 'O(n)', preemptive: true },
    priority: { name: 'Priority Scheduling', description: 'Highest priority executes first. Non-preemptive.', complexity: 'O(n)', preemptive: false },
    priorityP: { name: 'Priority (Preemptive)', description: 'Preemptive priority. Higher priority preempts current.', complexity: 'O(n)', preemptive: true },
};

const PROCESS_COLORS = ['#06b6d4', '#a855f7', '#22c55e', '#eab308', '#ef4444', '#ec4899', '#f97316', '#3b82f6', '#14b8a6', '#8b5cf6'];

const DEFAULT_PROCESSES = [
    { id: 1, name: 'P1', arrival: 0, burst: 6, priority: 2 },
    { id: 2, name: 'P2', arrival: 1, burst: 4, priority: 1 },
    { id: 3, name: 'P3', arrival: 2, burst: 8, priority: 3 },
    { id: 4, name: 'P4', arrival: 3, burst: 3, priority: 4 },
];

function simulateFCFS(processes) {
    const sorted = [...processes].sort((a, b) => a.arrival - b.arrival);
    const timeline = [];
    let currentTime = 0;
    const results = [];

    for (const p of sorted) {
        if (currentTime < p.arrival) currentTime = p.arrival;
        const start = currentTime;
        const finish = start + p.burst;
        for (let t = start; t < finish; t++) {
            timeline.push({ time: t, pid: p.id, name: p.name });
        }
        results.push({ ...p, start, finish, waitingTime: start - p.arrival, turnaround: finish - p.arrival, responseTime: start - p.arrival });
        currentTime = finish;
    }
    return { timeline, results };
}

function simulateSJF(processes) {
    const remaining = processes.map(p => ({ ...p }));
    const timeline = [];
    const results = [];
    let currentTime = 0;

    while (remaining.length > 0) {
        const available = remaining.filter(p => p.arrival <= currentTime);
        if (available.length === 0) { currentTime = Math.min(...remaining.map(p => p.arrival)); continue; }
        available.sort((a, b) => a.burst - b.burst);
        const p = available[0];
        const start = currentTime;
        const finish = start + p.burst;
        for (let t = start; t < finish; t++) {
            timeline.push({ time: t, pid: p.id, name: p.name });
        }
        results.push({ ...p, start, finish, waitingTime: start - p.arrival, turnaround: finish - p.arrival, responseTime: start - p.arrival });
        currentTime = finish;
        remaining.splice(remaining.indexOf(remaining.find(r => r.id === p.id)), 1);
    }
    return { timeline, results };
}

function simulateSRTF(processes) {
    const timeline = [];
    const remaining = processes.map(p => ({ ...p, remainingBurst: p.burst, started: false, firstStart: -1 }));
    let currentTime = 0;
    const maxTime = Math.max(...processes.map(p => p.arrival + p.burst)) + processes.reduce((s, p) => s + p.burst, 0);

    while (remaining.some(p => p.remainingBurst > 0) && currentTime < maxTime) {
        const available = remaining.filter(p => p.arrival <= currentTime && p.remainingBurst > 0);
        if (available.length === 0) { currentTime++; continue; }
        available.sort((a, b) => a.remainingBurst - b.remainingBurst);
        const p = available[0];
        if (!p.started) { p.firstStart = currentTime; p.started = true; }
        timeline.push({ time: currentTime, pid: p.id, name: p.name });
        p.remainingBurst--;
        currentTime++;
    }

    const results = remaining.map(p => {
        const finishTime = timeline.filter(t => t.pid === p.id).length > 0 ? timeline.filter(t => t.pid === p.id).pop().time + 1 : p.arrival + p.burst;
        return { ...p, start: p.firstStart, finish: finishTime, waitingTime: finishTime - p.arrival - p.burst, turnaround: finishTime - p.arrival, responseTime: p.firstStart - p.arrival };
    });
    return { timeline, results };
}

function simulateRR(processes, quantum = 2) {
    const timeline = [];
    const queue = [];
    const remaining = processes.map(p => ({ ...p, remainingBurst: p.burst, firstStart: -1 }));
    let currentTime = 0;

    const arrivals = [...remaining].sort((a, b) => a.arrival - b.arrival);
    let arrIdx = 0;

    while (arrIdx < arrivals.length && arrivals[arrIdx].arrival <= currentTime) {
        queue.push(arrivals[arrIdx]);
        arrIdx++;
    }

    const maxTime = processes.reduce((s, p) => s + p.burst, 0) + Math.max(...processes.map(p => p.arrival)) + 100;

    while ((queue.length > 0 || arrIdx < arrivals.length) && currentTime < maxTime) {
        if (queue.length === 0) {
            currentTime = arrivals[arrIdx].arrival;
            while (arrIdx < arrivals.length && arrivals[arrIdx].arrival <= currentTime) { queue.push(arrivals[arrIdx]); arrIdx++; }
        }

        const p = queue.shift();
        if (p.firstStart === -1) p.firstStart = currentTime;
        const execTime = Math.min(quantum, p.remainingBurst);

        for (let t = 0; t < execTime; t++) {
            timeline.push({ time: currentTime + t, pid: p.id, name: p.name });
        }
        currentTime += execTime;
        p.remainingBurst -= execTime;

        while (arrIdx < arrivals.length && arrivals[arrIdx].arrival <= currentTime) { queue.push(arrivals[arrIdx]); arrIdx++; }

        if (p.remainingBurst > 0) queue.push(p);
    }

    const results = remaining.map(p => {
        const slots = timeline.filter(t => t.pid === p.id);
        const finishTime = slots.length > 0 ? slots[slots.length - 1].time + 1 : p.arrival + p.burst;
        return { ...p, start: p.firstStart, finish: finishTime, waitingTime: finishTime - p.arrival - p.burst, turnaround: finishTime - p.arrival, responseTime: p.firstStart - p.arrival };
    });
    return { timeline, results };
}

function simulatePriority(processes, preemptive = false) {
    if (!preemptive) {
        const remaining = processes.map(p => ({ ...p }));
        const timeline = [];
        const results = [];
        let currentTime = 0;

        while (remaining.length > 0) {
            const available = remaining.filter(p => p.arrival <= currentTime);
            if (available.length === 0) { currentTime = Math.min(...remaining.map(p => p.arrival)); continue; }
            available.sort((a, b) => a.priority - b.priority);
            const p = available[0];
            const start = currentTime;
            const finish = start + p.burst;
            for (let t = start; t < finish; t++) timeline.push({ time: t, pid: p.id, name: p.name });
            results.push({ ...p, start, finish, waitingTime: start - p.arrival, turnaround: finish - p.arrival, responseTime: start - p.arrival });
            currentTime = finish;
            remaining.splice(remaining.indexOf(remaining.find(r => r.id === p.id)), 1);
        }
        return { timeline, results };
    }

    const timeline = [];
    const remaining = processes.map(p => ({ ...p, remainingBurst: p.burst, firstStart: -1 }));
    let currentTime = 0;
    const maxTime = Math.max(...processes.map(p => p.arrival + p.burst)) + processes.reduce((s, p) => s + p.burst, 0);

    while (remaining.some(p => p.remainingBurst > 0) && currentTime < maxTime) {
        const available = remaining.filter(p => p.arrival <= currentTime && p.remainingBurst > 0);
        if (available.length === 0) { currentTime++; continue; }
        available.sort((a, b) => a.priority - b.priority);
        const p = available[0];
        if (p.firstStart === -1) p.firstStart = currentTime;
        timeline.push({ time: currentTime, pid: p.id, name: p.name });
        p.remainingBurst--;
        currentTime++;
    }

    const results = remaining.map(p => {
        const slots = timeline.filter(t => t.pid === p.id);
        const finishTime = slots.length > 0 ? slots[slots.length - 1].time + 1 : p.arrival + p.burst;
        return { ...p, start: p.firstStart, finish: finishTime, waitingTime: finishTime - p.arrival - p.burst, turnaround: finishTime - p.arrival, responseTime: p.firstStart - p.arrival };
    });
    return { timeline, results };
}

function SchedulerSimulator() {
    const [processes, setProcesses] = useState(DEFAULT_PROCESSES);
    const [algorithm, setAlgorithm] = useState('fcfs');
    const [quantum, setQuantum] = useState(2);
    const [simulation, setSimulation] = useState(null);
    const [animationStep, setAnimationStep] = useState(-1);
    const [isAnimating, setIsAnimating] = useState(false);
    const animRef = useRef(null);
    const nextId = useRef(5);

    const algoInfo = ALGORITHMS[algorithm];

    const addProcess = () => {
        const id = nextId.current++;
        setProcesses(prev => [...prev, { id, name: `P${id}`, arrival: 0, burst: 3, priority: 1 }]);
    };

    const removeProcess = (id) => {
        setProcesses(prev => prev.filter(p => p.id !== id));
    };

    const updateProcess = (id, field, value) => {
        setProcesses(prev => prev.map(p => p.id === id ? { ...p, [field]: Math.max(0, parseInt(value) || 0) } : p));
    };

    const runSimulation = useCallback(() => {
        let result;
        switch (algorithm) {
            case 'fcfs': result = simulateFCFS(processes); break;
            case 'sjf': result = simulateSJF(processes); break;
            case 'srtf': result = simulateSRTF(processes); break;
            case 'rr': result = simulateRR(processes, quantum); break;
            case 'priority': result = simulatePriority(processes, false); break;
            case 'priorityP': result = simulatePriority(processes, true); break;
            default: result = simulateFCFS(processes);
        }
        setSimulation(result);
        setAnimationStep(-1);
        setIsAnimating(false);
    }, [processes, algorithm, quantum]);

    const startAnimation = () => {
        if (!simulation || simulation.timeline.length === 0) return;
        setIsAnimating(true);
        setAnimationStep(0);
    };

    useEffect(() => {
        if (!isAnimating || !simulation) return;
        if (animationStep >= simulation.timeline.length) {
            setIsAnimating(false);
            return;
        }
        animRef.current = setTimeout(() => {
            setAnimationStep(prev => prev + 1);
        }, 400);
        return () => clearTimeout(animRef.current);
    }, [isAnimating, animationStep, simulation]);

    const stopAnimation = () => {
        setIsAnimating(false);
        clearTimeout(animRef.current);
        if (simulation) setAnimationStep(simulation.timeline.length);
    };

    const reset = () => {
        setSimulation(null);
        setAnimationStep(-1);
        setIsAnimating(false);
    };

    const metrics = useMemo(() => {
        if (!simulation) return null;
        const r = simulation.results;
        return {
            avgWaiting: (r.reduce((s, p) => s + p.waitingTime, 0) / r.length).toFixed(2),
            avgTurnaround: (r.reduce((s, p) => s + p.turnaround, 0) / r.length).toFixed(2),
            avgResponse: (r.reduce((s, p) => s + p.responseTime, 0) / r.length).toFixed(2),
            throughput: (r.length / (Math.max(...r.map(p => p.finish)))).toFixed(3),
            cpuUtil: ((simulation.timeline.length / Math.max(...r.map(p => p.finish))) * 100).toFixed(1),
        };
    }, [simulation]);

    const visibleTimeline = useMemo(() => {
        if (!simulation) return [];
        const end = animationStep >= 0 ? animationStep : simulation.timeline.length;
        return simulation.timeline.slice(0, end);
    }, [simulation, animationStep]);

    const ganttData = useMemo(() => {
        if (!simulation) return [];
        const maxTime = Math.max(...simulation.results.map(p => p.finish));
        return Array.from({ length: maxTime }, (_, t) => {
            const slot = visibleTimeline.find(s => s.time === t);
            const entry = { time: t };
            processes.forEach(p => { entry[p.name] = slot?.pid === p.id ? 1 : 0; });
            return entry;
        });
    }, [simulation, visibleTimeline, processes]);

    const comparisonData = useMemo(() => {
        if (!simulation) return [];
        return simulation.results.map(p => ({
            name: p.name,
            waiting: p.waitingTime,
            turnaround: p.turnaround,
            response: p.responseTime,
        }));
    }, [simulation]);

    // --- NEW CHART DATA ---

    // 1. CPU Utilization Donut
    const cpuUtilData = useMemo(() => {
        if (!simulation) return [];
        const maxTime = Math.max(...simulation.results.map(p => p.finish));
        const busyTime = simulation.timeline.length;
        const idleTime = maxTime - busyTime;
        return [
            { name: 'CPU Busy', value: busyTime, fill: '#06b6d4' },
            { name: 'CPU Idle', value: Math.max(0, idleTime), fill: '#334155' },
        ];
    }, [simulation]);

    // 2. Process Timeline Area
    const processTimelineData = useMemo(() => {
        if (!simulation) return [];
        const maxTime = Math.max(...simulation.results.map(p => p.finish));
        const data = [];
        for (let t = 0; t <= maxTime; t++) {
            const entry = { time: t };
            processes.forEach((p, i) => {
                const executed = simulation.timeline.filter(s => s.pid === p.id && s.time <= t).length;
                entry[p.name] = executed;
            });
            data.push(entry);
        }
        return data;
    }, [simulation, processes]);

    // 3. Waiting vs Turnaround Scatter
    const scatterData = useMemo(() => {
        if (!simulation) return [];
        return simulation.results.map((p, i) => ({
            name: p.name,
            waiting: p.waitingTime,
            turnaround: p.turnaround,
            burst: p.burst,
            fill: PROCESS_COLORS[i % PROCESS_COLORS.length],
        }));
    }, [simulation]);

    // 4. Algorithm Efficiency Radar
    const radarData = useMemo(() => {
        if (!metrics || !simulation) return [];
        const maxWait = Math.max(...simulation.results.map(p => p.waitingTime), 1);
        const maxTurn = Math.max(...simulation.results.map(p => p.turnaround), 1);
        const maxResp = Math.max(...simulation.results.map(p => p.responseTime), 1);
        return [
            { metric: 'Low Wait', value: Math.max(0, 100 - (parseFloat(metrics.avgWaiting) / maxWait) * 50), fullMark: 100 },
            { metric: 'Low Turnaround', value: Math.max(0, 100 - (parseFloat(metrics.avgTurnaround) / maxTurn) * 30), fullMark: 100 },
            { metric: 'Fast Response', value: Math.max(0, 100 - (parseFloat(metrics.avgResponse) / maxResp) * 50), fullMark: 100 },
            { metric: 'Throughput', value: Math.min(100, parseFloat(metrics.throughput) * 100), fullMark: 100 },
            { metric: 'CPU Util', value: parseFloat(metrics.cpuUtil), fullMark: 100 },
        ];
    }, [metrics, simulation]);

    // 5. Process Completion Timeline
    const completionData = useMemo(() => {
        if (!simulation) return [];
        return simulation.results
            .sort((a, b) => a.finish - b.finish)
            .map((p, i) => ({
                name: p.name,
                finish: p.finish,
                arrival: p.arrival,
                order: i + 1,
            }));
    }, [simulation]);

    // 6. Burst vs Wait Composed
    const burstWaitData = useMemo(() => {
        if (!simulation) return [];
        return simulation.results.map((p, i) => ({
            name: p.name,
            burst: p.burst,
            waiting: p.waitingTime,
            turnaround: p.turnaround,
        }));
    }, [simulation]);

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30">
                        <Cpu className="text-orange-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">CPU Scheduler Simulator</h1>
                        <p className="text-sm text-slate-400">Visualize OS scheduling algorithms and their impact</p>
                    </div>
                </div>
            </motion.div>

            {/* Algorithm Selection + Quantum */}
            <div className="glass-panel p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className="text-xs text-slate-400 uppercase tracking-wide mb-2 block">Scheduling Algorithm</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(ALGORITHMS).map(([key, algo]) => (
                                <button
                                    key={key}
                                    onClick={() => { setAlgorithm(key); reset(); }}
                                    className={`p-3 rounded-xl text-left transition-all border ${algorithm === key
                                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                                        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="text-sm font-medium">{algo.name.split('(')[0].trim()}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{algo.preemptive ? 'Preemptive' : 'Non-preemptive'}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                            <h4 className="text-sm font-medium text-slate-300 mb-1">{algoInfo.name}</h4>
                            <p className="text-xs text-slate-500 mb-2">{algoInfo.description}</p>
                            <div className="flex gap-3 text-[10px]">
                                <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-400">Complexity: {algoInfo.complexity}</span>
                                <span className={`px-2 py-0.5 rounded ${algoInfo.preemptive ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {algoInfo.preemptive ? 'Preemptive' : 'Non-preemptive'}
                                </span>
                            </div>
                        </div>

                        {algorithm === 'rr' && (
                            <div>
                                <label className="text-xs text-slate-400 uppercase mb-1.5 block">Time Quantum: {quantum}</label>
                                <input type="range" min="1" max="10" value={quantum} onChange={e => { setQuantum(parseInt(e.target.value)); reset(); }} className="w-full accent-cyan-500" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Process Table */}
            <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                        <Layers size={18} className="text-purple-400" /> Process Queue
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={addProcess} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 border border-slate-700 transition-colors">
                            <Plus size={14} /> Add
                        </button>
                        <button onClick={() => { setProcesses(DEFAULT_PROCESSES); nextId.current = 5; reset(); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 border border-slate-700 transition-colors">
                            <RotateCcw size={14} /> Reset
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-slate-400 border-b border-slate-700/50">
                                <th className="text-left p-2">Color</th>
                                <th className="text-left p-2">Process</th>
                                <th className="text-center p-2">Arrival Time</th>
                                <th className="text-center p-2">Burst Time</th>
                                {(algorithm === 'priority' || algorithm === 'priorityP') && <th className="text-center p-2">Priority</th>}
                                <th className="text-center p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processes.map((p, i) => (
                                <tr key={p.id} className="border-b border-slate-700/30">
                                    <td className="p-2">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: PROCESS_COLORS[i % PROCESS_COLORS.length] }} />
                                    </td>
                                    <td className="p-2 font-mono text-slate-200">{p.name}</td>
                                    <td className="p-2 text-center">
                                        <input type="number" min="0" value={p.arrival} onChange={e => updateProcess(p.id, 'arrival', e.target.value)}
                                            className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center text-slate-200 focus:outline-none focus:border-cyan-500" />
                                    </td>
                                    <td className="p-2 text-center">
                                        <input type="number" min="1" value={p.burst} onChange={e => updateProcess(p.id, 'burst', e.target.value)}
                                            className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center text-slate-200 focus:outline-none focus:border-cyan-500" />
                                    </td>
                                    {(algorithm === 'priority' || algorithm === 'priorityP') && (
                                        <td className="p-2 text-center">
                                            <input type="number" min="1" value={p.priority} onChange={e => updateProcess(p.id, 'priority', e.target.value)}
                                                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center text-slate-200 focus:outline-none focus:border-cyan-500" />
                                        </td>
                                    )}
                                    <td className="p-2 text-center">
                                        <button onClick={() => removeProcess(p.id)} disabled={processes.length <= 1} className="p-1 text-slate-500 hover:text-red-400 disabled:opacity-30 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Controls */}
                <div className="flex gap-3 mt-4 justify-end">
                    {simulation && (
                        <>
                            {!isAnimating && animationStep < (simulation?.timeline?.length || 0) && (
                                <button onClick={startAnimation} className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl border border-purple-500/30 transition-colors">
                                    <Play size={16} /> Animate
                                </button>
                            )}
                            {isAnimating && (
                                <button onClick={stopAnimation} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl border border-red-500/30 transition-colors">
                                    <Activity size={16} /> Skip
                                </button>
                            )}
                        </>
                    )}
                    <button
                        onClick={runSimulation}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-medium text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow"
                    >
                        <Play size={16} /> Run Simulation
                    </button>
                </div>
            </div>

            {/* Results */}
            <AnimatePresence>
                {simulation && (
                    <>
                        {/* Gantt Chart */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
                            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                <BarChart3 size={18} className="text-cyan-400" /> Gantt Chart
                                {isAnimating && <span className="text-xs text-cyan-400 animate-pulse ml-2">Animating...</span>}
                            </h3>

                            {/* Visual Gantt */}
                            <div className="overflow-x-auto mb-6">
                                <div className="flex gap-0 min-w-fit">
                                    {ganttData.map((slot, t) => {
                                        const activeProcess = processes.find(p => slot[p.name] === 1);
                                        const colorIdx = activeProcess ? processes.indexOf(activeProcess) : -1;
                                        const isVisible = animationStep < 0 || t < animationStep;

                                        return (
                                            <div key={t} className="flex flex-col items-center" style={{ minWidth: 36 }}>
                                                <motion.div
                                                    initial={{ opacity: 0, scaleY: 0 }}
                                                    animate={{ opacity: isVisible ? 1 : 0.2, scaleY: isVisible ? 1 : 0.3 }}
                                                    className="w-8 h-12 rounded-sm flex items-center justify-center text-[10px] font-mono font-bold text-white border border-slate-700/30"
                                                    style={{ backgroundColor: activeProcess ? PROCESS_COLORS[colorIdx % PROCESS_COLORS.length] : '#1e293b' }}
                                                >
                                                    {activeProcess ? activeProcess.name : ''}
                                                </motion.div>
                                                <span className="text-[9px] text-slate-500 mt-1">{t}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-3">
                                {processes.map((p, i) => (
                                    <div key={p.id} className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PROCESS_COLORS[i % PROCESS_COLORS.length] }} />
                                        {p.name}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Metrics */}
                        {metrics && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                    <div className="glass-panel p-4">
                                        <div className="text-xs text-slate-500 uppercase mb-1">Avg Wait</div>
                                        <div className="text-2xl font-bold text-cyan-400">{metrics.avgWaiting}<span className="text-sm text-slate-500 ml-1">units</span></div>
                                    </div>
                                    <div className="glass-panel p-4">
                                        <div className="text-xs text-slate-500 uppercase mb-1">Avg Turnaround</div>
                                        <div className="text-2xl font-bold text-purple-400">{metrics.avgTurnaround}<span className="text-sm text-slate-500 ml-1">units</span></div>
                                    </div>
                                    <div className="glass-panel p-4">
                                        <div className="text-xs text-slate-500 uppercase mb-1">Avg Response</div>
                                        <div className="text-2xl font-bold text-green-400">{metrics.avgResponse}<span className="text-sm text-slate-500 ml-1">units</span></div>
                                    </div>
                                    <div className="glass-panel p-4">
                                        <div className="text-xs text-slate-500 uppercase mb-1">Throughput</div>
                                        <div className="text-2xl font-bold text-yellow-400">{metrics.throughput}<span className="text-sm text-slate-500 ml-1">p/unit</span></div>
                                    </div>
                                    <div className="glass-panel p-4">
                                        <div className="text-xs text-slate-500 uppercase mb-1">CPU Util.</div>
                                        <div className="text-2xl font-bold text-emerald-400">{metrics.cpuUtil}%</div>
                                    </div>
                                </div>

                                {/* Per-Process Results Table */}
                                <div className="glass-panel p-6 mb-6">
                                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                        <Activity size={18} className="text-orange-400" /> Per-Process Results
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-slate-400 border-b border-slate-700/50">
                                                    <th className="text-left p-2">Process</th>
                                                    <th className="text-center p-2">Arrival</th>
                                                    <th className="text-center p-2">Burst</th>
                                                    <th className="text-center p-2">Start</th>
                                                    <th className="text-center p-2">Finish</th>
                                                    <th className="text-center p-2">Waiting</th>
                                                    <th className="text-center p-2">Turnaround</th>
                                                    <th className="text-center p-2">Response</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {simulation.results.map((p, i) => (
                                                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                                                        <td className="p-2 flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PROCESS_COLORS[i % PROCESS_COLORS.length] }} />
                                                            <span className="font-mono text-slate-200">{p.name}</span>
                                                        </td>
                                                        <td className="p-2 text-center text-slate-400">{p.arrival}</td>
                                                        <td className="p-2 text-center text-slate-400">{p.burst}</td>
                                                        <td className="p-2 text-center text-cyan-400 font-mono">{p.start}</td>
                                                        <td className="p-2 text-center text-purple-400 font-mono">{p.finish}</td>
                                                        <td className="p-2 text-center text-yellow-400 font-mono">{p.waitingTime}</td>
                                                        <td className="p-2 text-center text-green-400 font-mono">{p.turnaround}</td>
                                                        <td className="p-2 text-center text-orange-400 font-mono">{p.responseTime}</td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Comparison Chart */}
                                <div className="glass-panel p-6">
                                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                        <BarChart3 size={18} className="text-purple-400" /> Process Comparison
                                    </h3>
                                    <div className="h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={comparisonData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                                                <Bar dataKey="waiting" name="Waiting Time" fill="#eab308" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="turnaround" name="Turnaround" fill="#a855f7" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="response" name="Response" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* === NEW CHARTS GRID === */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* 1. CPU Utilization Donut */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel p-6">
                                        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                            <PieChartIcon size={18} className="text-cyan-400" /> CPU Utilization
                                        </h3>
                                        <div className="h-[240px] flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={cpuUtilData}
                                                        cx="50%" cy="50%"
                                                        innerRadius={60} outerRadius={90}
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                        stroke="none"
                                                    >
                                                        {cpuUtilData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                                                    <Legend
                                                        verticalAlign="bottom"
                                                        iconType="circle"
                                                        formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="text-center mt-2">
                                            <span className="text-2xl font-bold text-cyan-400">{metrics?.cpuUtil}%</span>
                                            <span className="text-xs text-slate-500 ml-2">utilization</span>
                                        </div>
                                    </motion.div>

                                    {/* 2. Algorithm Efficiency Radar */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6">
                                        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                            <RadarIcon size={18} className="text-emerald-400" /> Efficiency Radar
                                        </h3>
                                        <div className="h-[280px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                                                    <PolarGrid stroke="#334155" />
                                                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                                                    <Radar name="Score" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </motion.div>

                                    {/* 3. Process Timeline Area */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-panel p-6">
                                        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                            <TrendingUp size={18} className="text-blue-400" /> Process Execution Progress
                                        </h3>
                                        <div className="h-[240px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={processTimelineData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                    <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} label={{ value: 'Time', position: 'insideBottom', offset: -2, style: { fill: '#64748b', fontSize: 11 } }} />
                                                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Units Done', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 11 } }} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                                                    {processes.map((p, i) => (
                                                        <Area
                                                            key={p.id}
                                                            type="monotone"
                                                            dataKey={p.name}
                                                            stackId="1"
                                                            stroke={PROCESS_COLORS[i % PROCESS_COLORS.length]}
                                                            fill={PROCESS_COLORS[i % PROCESS_COLORS.length]}
                                                            fillOpacity={0.3}
                                                        />
                                                    ))}
                                                    <Legend iconType="circle" formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </motion.div>

                                    {/* 4. Waiting vs Turnaround Scatter */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6">
                                        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                            <Target size={18} className="text-yellow-400" /> Waiting vs Turnaround
                                        </h3>
                                        <div className="h-[240px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ScatterChart>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                    <XAxis dataKey="waiting" name="Waiting Time" stroke="#94a3b8" tick={{ fontSize: 10 }} label={{ value: 'Waiting Time', position: 'insideBottom', offset: -2, style: { fill: '#64748b', fontSize: 11 } }} />
                                                    <YAxis dataKey="turnaround" name="Turnaround" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Turnaround', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 11 } }} />
                                                    <ZAxis dataKey="burst" range={[80, 400]} name="Burst Time" />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                                                        formatter={(value, name) => [value, name]}
                                                        labelFormatter={(label) => ''}
                                                        cursor={{ strokeDasharray: '3 3' }}
                                                    />
                                                    <Scatter data={scatterData} name="Processes">
                                                        {scatterData.map((entry, index) => (
                                                            <Cell key={`sc-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Scatter>
                                                </ScatterChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex flex-wrap gap-3 mt-3 justify-center">
                                            {scatterData.map((p, i) => (
                                                <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
                                                    {p.name}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* 5. Process Completion Timeline */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-panel p-6">
                                        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                            <GitBranch size={18} className="text-pink-400" /> Completion Timeline
                                        </h3>
                                        <div className="h-[240px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={completionData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Time', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 11 } }} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                                                    <Line type="monotone" dataKey="arrival" name="Arrival" stroke="#64748b" strokeWidth={2} dot={{ fill: '#64748b', r: 5 }} strokeDasharray="5 5" />
                                                    <Line type="monotone" dataKey="finish" name="Finish" stroke="#ec4899" strokeWidth={3} dot={{ fill: '#ec4899', r: 6, strokeWidth: 2, stroke: '#1e293b' }} />
                                                    <Legend iconType="circle" formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </motion.div>

                                    {/* 6. Burst vs Wait Composed */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel p-6">
                                        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                            <Combine size={18} className="text-orange-400" /> Burst vs Waiting Overlay
                                        </h3>
                                        <div className="h-[240px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart data={burstWaitData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                                                    <Bar dataKey="burst" name="Burst Time" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} fillOpacity={0.8} />
                                                    <Bar dataKey="waiting" name="Waiting Time" fill="#f97316" radius={[4, 4, 0, 0]} barSize={28} fillOpacity={0.8} />
                                                    <Line type="monotone" dataKey="turnaround" name="Turnaround" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 5, strokeWidth: 2, stroke: '#1e293b' }} />
                                                    <Legend iconType="circle" formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>} />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </motion.div>

                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </AnimatePresence>

            {/* Info Footer */}
            <div className="glass-panel p-4 flex items-start gap-3">
                <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-500">
                    <p className="mb-1"><strong>About:</strong> This simulator demonstrates how different CPU scheduling algorithms in operating systems affect process execution order, waiting time, and overall throughput.</p>
                    <p><strong>Relevance to Power Consumption:</strong> Scheduling efficiency directly impacts CPU idle time and power usage — more idle gaps means higher C-state transitions and power savings, while busy-wait scheduling keeps the CPU active and consumes more energy.</p>
                </div>
            </div>
        </div>
    );
}

export default SchedulerSimulator;
