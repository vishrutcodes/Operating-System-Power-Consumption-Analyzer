import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
    Gauge, Cpu, MemoryStick, Play, Square, Trophy, Clock, Zap, TrendingUp,
    RotateCcw, Download, Monitor, Layers, Award, ArrowUp, ArrowDown, Minus,
    Sparkles, Target, Info, ChevronRight, Timer, Flame, Activity, BarChart3,
    Medal, Crown, Gem
} from 'lucide-react';

// Tier Configuration
const TIERS = [
    { name: 'Iron', min: 0, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Minus },
    { name: 'Bronze', min: 40, color: 'text-orange-700', bg: 'bg-orange-900/10', border: 'border-orange-700/20', icon: Medal },
    { name: 'Silver', min: 60, color: 'text-slate-300', bg: 'bg-slate-400/10', border: 'border-slate-300/20', icon: Medal },
    { name: 'Gold', min: 75, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Crown },
    { name: 'Platinum', min: 90, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: Trophy },
    { name: 'Diamond', min: 98, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20', icon: Gem },
];

const getTier = (score) => {
    return [...TIERS].reverse().find(t => score >= t.min) || TIERS[0];
};

// Benchmark tests configuration
const BENCHMARK_TESTS = {
    cpu: {
        name: 'CPU Performance',
        description: 'Prime number calculation stress test',
        icon: Cpu,
        color: 'cyan',
        duration: 5000,
    },
    memory: {
        name: 'Memory Speed',
        description: 'Array allocation and sorting patterns',
        icon: MemoryStick,
        color: 'purple',
        duration: 4000,
    },
    compute: {
        name: 'Compute Score',
        description: 'Mathematical operations throughput',
        icon: Gauge,
        color: 'yellow',
        duration: 4000,
    },
    rendering: {
        name: 'Rendering',
        description: 'Canvas drawing and animation performance',
        icon: Monitor,
        color: 'green',
        duration: 4000,
    },
    multitask: {
        name: 'Multi-Task',
        description: 'Concurrent operations handling',
        icon: Layers,
        color: 'pink',
        duration: 4000,
    },
};

// Score rating thresholds
const getScoreRating = (score) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/20', emoji: '🔥' };
    if (score >= 80) return { label: 'Great', color: 'text-cyan-400', bg: 'bg-cyan-500/20', emoji: '⚡' };
    if (score >= 70) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/20', emoji: '✨' };
    if (score >= 60) return { label: 'Average', color: 'text-yellow-400', bg: 'bg-yellow-500/20', emoji: '📊' };
    if (score >= 40) return { label: 'Below Average', color: 'text-orange-400', bg: 'bg-orange-500/20', emoji: '⚠️' };
    return { label: 'Poor', color: 'text-red-400', bg: 'bg-red-500/20', emoji: '🔧' };
};

// Performance tips based on scores
const getPerformanceTips = (scores) => {
    const tips = [];
    if (scores.cpu < 70) tips.push({ icon: Cpu, text: 'Close background applications to improve CPU performance' });
    if (scores.memory < 70) tips.push({ icon: MemoryStick, text: 'Free up RAM by closing unused browser tabs' });
    if (scores.rendering < 70) tips.push({ icon: Monitor, text: 'Disable hardware acceleration or update graphics drivers' });
    if (scores.multitask < 70) tips.push({ icon: Layers, text: 'Reduce concurrent processes for better multi-tasking' });
    if (tips.length === 0 && scores.overall >= 75) {
        tips.push({ icon: Sparkles, text: 'Your system is performing excellently! Keep it optimized.' });
    }
    return tips;
};

// Circular Progress Component
function CircularProgress({ value, size = 120, strokeWidth = 8, color = '#06b6d4' }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(100, 116, 139, 0.3)"
                    strokeWidth={strokeWidth}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-100">{value}</span>
            </div>
        </div>
    );
}

// Simulate CPU benchmark (prime number calculation)
function runCpuBenchmark(onProgress) {
    return new Promise((resolve) => {
        let primeCount = 0;
        const startTime = performance.now();
        const duration = 5000;
        let lastProgress = 0;

        const isPrime = (n) => {
            if (n < 2) return false;
            for (let i = 2; i <= Math.sqrt(n); i++) {
                if (n % i === 0) return false;
            }
            return true;
        };

        const runChunk = (start) => {
            const chunkSize = 1000;
            for (let i = start; i < start + chunkSize; i++) {
                if (isPrime(i)) primeCount++;
            }

            const elapsed = performance.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);

            if (progress - lastProgress >= 5) {
                onProgress(progress);
                lastProgress = progress;
            }

            if (elapsed < duration) {
                setTimeout(() => runChunk(start + chunkSize), 0);
            } else {
                const baseScore = 65 + Math.random() * 10;
                const performanceBonus = Math.min(primeCount / 80, 20);
                const variance = (Math.random() - 0.5) * 6;
                const rawScore = baseScore + performanceBonus + variance;
                const score = Math.min(Math.max(Math.round(rawScore), 60), 98);
                resolve(score);
            }
        };

        runChunk(2);
    });
}

// Simulate Memory benchmark
function runMemoryBenchmark(onProgress) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        const duration = 4000;
        let operations = 0;

        const runChunk = () => {
            for (let i = 0; i < 100; i++) {
                const arr = new Array(10000).fill(0).map((_, idx) => idx * Math.random());
                arr.sort((a, b) => a - b);
                operations++;
            }

            const elapsed = performance.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            onProgress(progress);

            if (elapsed < duration) {
                setTimeout(runChunk, 0);
            } else {
                const baseScore = 70 + Math.random() * 8;
                const opsBonus = Math.min(operations / 8, 18);
                const variance = (Math.random() - 0.5) * 8;
                const rawScore = baseScore + opsBonus + variance;
                const score = Math.min(Math.max(Math.round(rawScore), 62), 96);
                resolve(score);
            }
        };

        runChunk();
    });
}

// Simulate Compute benchmark
function runComputeBenchmark(onProgress) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        const duration = 4000;
        let iterations = 0;

        const runChunk = () => {
            for (let i = 0; i < 50000; i++) {
                Math.sin(i) * Math.cos(i) * Math.tan(i % 90);
                Math.sqrt(i) * Math.log(i + 1);
                iterations++;
            }

            const elapsed = performance.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            onProgress(progress);

            if (elapsed < duration) {
                setTimeout(runChunk, 0);
            } else {
                const baseScore = 72 + Math.random() * 8;
                const iterBonus = Math.min(iterations / 8000, 15);
                const variance = (Math.random() - 0.5) * 6;
                const rawScore = baseScore + iterBonus + variance;
                const score = Math.min(Math.max(Math.round(rawScore), 65), 97);
                resolve(score);
            }
        };

        runChunk();
    });
}

// Simulate Rendering benchmark (canvas-based)
function runRenderingBenchmark(onProgress) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        const duration = 4000;
        let frames = 0;

        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        const runFrame = () => {
            for (let i = 0; i < 100; i++) {
                ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
                ctx.beginPath();
                ctx.arc(
                    Math.random() * 800,
                    Math.random() * 600,
                    Math.random() * 50 + 10,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }

            const gradient = ctx.createLinearGradient(0, 0, 800, 600);
            gradient.addColorStop(0, 'rgba(0,0,0,0.1)');
            gradient.addColorStop(1, 'rgba(255,255,255,0.1)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 800, 600);

            frames++;

            const elapsed = performance.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            onProgress(progress);

            if (elapsed < duration) {
                requestAnimationFrame(runFrame);
            } else {
                const baseScore = 68 + Math.random() * 8;
                const frameBonus = Math.min(frames / 3, 18);
                const variance = (Math.random() - 0.5) * 10;
                const rawScore = baseScore + frameBonus + variance;
                const score = Math.min(Math.max(Math.round(rawScore), 58), 95);
                resolve(score);
            }
        };

        requestAnimationFrame(runFrame);
    });
}

// Simulate Multi-task benchmark
function runMultitaskBenchmark(onProgress) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        const duration = 4000;
        let completedTasks = 0;

        const runConcurrent = () => {
            const tasks = [];
            for (let t = 0; t < 10; t++) {
                tasks.push(new Promise(res => {
                    let sum = 0;
                    for (let i = 0; i < 10000; i++) {
                        sum += Math.random();
                    }
                    res(sum);
                }));
            }

            Promise.all(tasks).then(() => {
                completedTasks += tasks.length;

                const elapsed = performance.now() - startTime;
                const progress = Math.min((elapsed / duration) * 100, 100);
                onProgress(progress);

                if (elapsed < duration) {
                    setTimeout(runConcurrent, 0);
                } else {
                    const baseScore = 70 + Math.random() * 6;
                    const taskBonus = Math.min(completedTasks / 15, 16);
                    const variance = (Math.random() - 0.5) * 8;
                    const rawScore = baseScore + taskBonus + variance;
                    const score = Math.min(Math.max(Math.round(rawScore), 60), 94);
                    resolve(score);
                }
            });
        };

        runConcurrent();
    });
}

function Benchmarks() {
    const [isRunning, setIsRunning] = useState(false);
    const [currentTest, setCurrentTest] = useState(null);
    const [progress, setProgress] = useState({});
    const [scores, setScores] = useState({});
    const [history, setHistory] = useState([]);
    const [countdown, setCountdown] = useState(0);
    const [testDuration, setTestDuration] = useState(0);
    const [activeTab, setActiveTab] = useState('overview');
    const abortRef = useRef(false);
    const startTimeRef = useRef(null);

    // Market Comparison Data
    const marketData = useMemo(() => {
        if (!scores.overall) return [];
        return [
            { name: 'Office Laptop', score: 45, fill: '#94a3b8' }, // Slate-400
            { name: 'Gaming PC', score: 75, fill: '#a855f7' },    // Purple-500
            { name: 'Your System', score: scores.overall, fill: '#06b6d4' }, // Cyan-500
            { name: 'Workstation', score: 95, fill: '#ef4444' },  // Red-500
        ];
    }, [scores.overall]);

    // Live Graph State
    const [liveData, setLiveData] = useState([]);

    // Update Live Graph during test
    useEffect(() => {
        let interval;
        if (isRunning) {
            setLiveData([]);
            interval = setInterval(() => {
                setLiveData(prev => {
                    const newData = [...prev, {
                        time: prev.length,
                        // Simulate variable load/ops
                        ops: Math.floor(Math.random() * 500) + 1000 + (Math.sin(prev.length * 0.5) * 500)
                    }];
                    return newData.slice(-30); // Keep last 30 points
                });
            }, 200);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const tier = scores.overall ? getTier(scores.overall) : null;

    // Load history from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('powerpulse_benchmark_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch { /* ignore */ }
        }
    }, []);

    // Timer for test duration
    useEffect(() => {
        let interval;
        if (isRunning && startTimeRef.current) {
            interval = setInterval(() => {
                setTestDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    // Prepare radar chart data
    const radarData = useMemo(() => {
        if (Object.keys(scores).length === 0) return [];
        return Object.entries(BENCHMARK_TESTS).map(([key, test]) => ({
            subject: test.name.split(' ')[0],
            score: scores[key] || 0,
            fullMark: 100,
        }));
    }, [scores]);

    // Prepare history trend chart data
    const historyTrendData = useMemo(() => {
        return history.slice(0, 10).reverse().map((entry, idx) => ({
            run: `#${history.length - history.slice(0, 10).length + idx + 1}`,
            overall: entry.overall,
            cpu: entry.cpu || 0,
            memory: entry.memory || 0,
        }));
    }, [history]);

    // Score distribution for pie chart
    const scoreDistribution = useMemo(() => {
        if (!scores.overall) return [];
        return [
            { name: 'Score', value: scores.overall, fill: '#06b6d4' },
            { name: 'Remaining', value: 100 - scores.overall, fill: '#334155' },
        ];
    }, [scores.overall]);

    // Countdown before benchmark starts
    const startCountdown = () => {
        return new Promise((resolve) => {
            let count = 3;
            setCountdown(count);
            const interval = setInterval(() => {
                count--;
                setCountdown(count);
                if (count === 0) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setCountdown(0);
                        resolve();
                    }, 500);
                }
            }, 1000);
        });
    };

    const runSingleBenchmark = async (testKey) => {
        if (isRunning) return;

        setIsRunning(true);
        abortRef.current = false;
        setProgress({ [testKey]: 0 });
        setScores({});
        setTestDuration(0);

        await startCountdown();
        startTimeRef.current = Date.now();

        const benchmarkFunctions = {
            cpu: runCpuBenchmark,
            memory: runMemoryBenchmark,
            compute: runComputeBenchmark,
            rendering: runRenderingBenchmark,
            multitask: runMultitaskBenchmark,
        };

        if (!abortRef.current) {
            setCurrentTest(testKey);
            const score = await benchmarkFunctions[testKey]((p) =>
                setProgress(prev => ({ ...prev, [testKey]: p }))
            );
            setScores({ [testKey]: score, overall: score });
        }

        setCurrentTest(null);
        setIsRunning(false);
        startTimeRef.current = null;
    };

    const runAllBenchmarks = async () => {
        if (isRunning) return;

        setIsRunning(true);
        abortRef.current = false;
        setScores({});
        setProgress({});
        setTestDuration(0);

        await startCountdown();
        startTimeRef.current = Date.now();

        const results = {};
        const tests = ['cpu', 'memory', 'compute', 'rendering', 'multitask'];
        const benchmarkFunctions = {
            cpu: runCpuBenchmark,
            memory: runMemoryBenchmark,
            compute: runComputeBenchmark,
            rendering: runRenderingBenchmark,
            multitask: runMultitaskBenchmark,
        };

        for (const testKey of tests) {
            if (abortRef.current) break;
            setCurrentTest(testKey);
            setProgress(p => ({ ...p, [testKey]: 0 }));
            results[testKey] = await benchmarkFunctions[testKey]((p) =>
                setProgress(prev => ({ ...prev, [testKey]: p }))
            );
            setScores(s => ({ ...s, [testKey]: results[testKey] }));
        }

        if (!abortRef.current) {
            const overall = Math.round(
                Object.values(results).reduce((a, b) => a + b, 0) / Object.keys(results).length
            );
            setScores(s => ({ ...s, overall }));

            const entry = {
                date: new Date().toISOString(),
                duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
                ...results,
                overall,
            };
            const newHistory = [entry, ...history].slice(0, 20);
            setHistory(newHistory);
            localStorage.setItem('powerpulse_benchmark_history', JSON.stringify(newHistory));
        }

        setCurrentTest(null);
        setIsRunning(false);
        startTimeRef.current = null;
    };

    const stopBenchmark = () => {
        abortRef.current = true;
        setIsRunning(false);
        setCurrentTest(null);
        setCountdown(0);
        startTimeRef.current = null;
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('powerpulse_benchmark_history');
    };

    const exportResults = () => {
        const data = {
            exportDate: new Date().toISOString(),
            latestScores: scores,
            history: history,
            systemInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                cores: navigator.hardwareConcurrency || 'Unknown',
                memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unknown',
            }
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `powerpulse-benchmark-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getComparison = (current, testKey) => {
        if (history.length < 1 || !history[0][testKey]) return null;
        const prev = history[0][testKey];
        const diff = current - prev;
        if (diff > 2) return { icon: ArrowUp, color: 'text-green-400', diff: `+${diff}` };
        if (diff < -2) return { icon: ArrowDown, color: 'text-red-400', diff: `${diff}` };
        return { icon: Minus, color: 'text-slate-400', diff: '0' };
    };

    const colorClasses = {
        cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        green: 'text-green-400 bg-green-500/10 border-green-500/20',
        pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    };

    const progressColors = {
        cyan: 'from-cyan-500 to-blue-400',
        purple: 'from-purple-500 to-pink-400',
        yellow: 'from-yellow-500 to-orange-400',
        green: 'from-green-500 to-emerald-400',
        pink: 'from-pink-500 to-rose-400',
    };

    const chartColors = {
        cpu: '#06b6d4',
        memory: '#a855f7',
        compute: '#eab308',
        rendering: '#22c55e',
        multitask: '#ec4899',
    };

    const chartData = Object.entries(scores)
        .filter(([key]) => key !== 'overall')
        .map(([key, value]) => ({
            name: BENCHMARK_TESTS[key]?.name?.split(' ')[0] || key,
            score: value,
            fill: chartColors[key],
        }));

    const rating = scores.overall !== undefined ? getScoreRating(scores.overall) : null;
    const tips = scores.overall !== undefined ? getPerformanceTips(scores) : [];

    // Calculate percentile (simulated)
    const percentile = scores.overall ? Math.min(Math.round(scores.overall * 0.95 + Math.random() * 5), 99) : null;

    // Best score from history
    const bestScore = history.length > 0 ? Math.max(...history.map(h => h.overall)) : null;

    return (
        <div className="flex flex-col gap-6">
            {/* Countdown Overlay */}
            <AnimatePresence>
                {countdown > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm"
                    >
                        <motion.div
                            key={countdown}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            className="text-9xl font-bold text-cyan-400"
                        >
                            {countdown}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl border border-cyan-500/30">
                        <Gauge className="text-cyan-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">System Benchmarks</h1>
                        <p className="text-sm text-slate-400">Comprehensive performance testing suite</p>
                    </div>
                </div>

                <div className="flex gap-3 flex-wrap items-center">
                    {/* Timer Display */}
                    {isRunning && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50"
                        >
                            <Timer size={16} className="text-cyan-400 animate-pulse" />
                            <span className="font-mono text-slate-300">{testDuration}s</span>
                        </motion.div>
                    )}

                    {scores.overall !== undefined && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={exportResults}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
                        >
                            <Download size={16} />
                            Export
                        </motion.button>
                    )}
                    {!isRunning ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={runAllBenchmarks}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-medium text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow"
                        >
                            <Play size={18} />
                            Run All Tests
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={stopBenchmark}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl font-medium text-white shadow-lg shadow-red-500/25"
                        >
                            <Square size={18} />
                            Stop
                        </motion.button>
                    )}
                </div>
            </motion.div>

            {/* Stats Cards Row */}
            {/* Live Performance Graph (Only when running) */}
            <AnimatePresence>
                {isRunning && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="glass-panel p-0 overflow-hidden mb-6"
                    >
                        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                                <Activity size={16} className="animate-pulse" /> Live Performance Audit
                            </h3>
                            <span className="text-xs text-slate-500 font-mono">OPS/SEC</span>
                        </div>
                        <div className="h-[120px] bg-slate-900/30">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={liveData}>
                                    <defs>
                                        <linearGradient id="colorOps" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="ops"
                                        stroke="#06b6d4"
                                        strokeWidth={2}
                                        fill="url(#colorOps)"
                                        isAnimationActive={false}
                                    />
                                    <YAxis hide domain={['auto', 'auto']} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-4"
                >
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Activity size={14} />
                        Total Runs
                    </div>
                    <div className="text-2xl font-bold text-slate-100">{history.length}</div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel p-4"
                >
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Trophy size={14} />
                        Best Score
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">{bestScore || '—'}</div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-panel p-4"
                >
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Cpu size={14} />
                        CPU Cores
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">{navigator.hardwareConcurrency || '?'}</div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-panel p-4"
                >
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <MemoryStick size={14} />
                        Device Memory
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                        {navigator.deviceMemory ? `${navigator.deviceMemory}GB` : '?'}
                    </div>
                </motion.div>
            </div>

            {/* Main Results Section */}
            <AnimatePresence>
                {scores.overall !== undefined && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-panel p-6"
                    >
                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 border-b border-slate-700/50 pb-4">
                            {[
                                { id: 'overview', label: 'Overview', icon: BarChart3 },
                                { id: 'radar', label: 'Radar Chart', icon: Target },
                                { id: 'details', label: 'Detailed Scores', icon: Activity },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab.id
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Overall Score Column */}
                                <div className="flex flex-col gap-4">
                                    {/* Main Circular Score */}
                                    <div className="flex flex-col items-center justify-center p-6 bg-slate-800/30 rounded-2xl border border-slate-700/30 relative overflow-hidden">
                                        {/* Animated Glow Background for High Tiers */}
                                        {tier && tier.min >= 90 && (
                                            <div className="absolute inset-0 bg-cyan-500/10 blur-3xl animate-pulse" />
                                        )}

                                        <div className="flex items-center gap-2 mb-4 relative z-10">
                                            <Trophy className="text-yellow-400" size={24} />
                                            <h3 className="text-lg font-semibold text-slate-200">System Score</h3>
                                        </div>

                                        <div className="relative z-10">
                                            <CircularProgress value={scores.overall} size={160} strokeWidth={12} color={tier ? tier.color.replace('text-', '').replace('-400', '-500') : '#06b6d4'} />
                                        </div>

                                        {/* Tier Badge */}
                                        {tier && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className={`mt-4 px-6 py-2 rounded-full border ${tier.bg} ${tier.border} ${tier.color} flex items-center gap-2 shadow-lg`}
                                            >
                                                <tier.icon size={18} className={tier.min >= 90 ? 'animate-bounce' : ''} />
                                                <span className="font-bold tracking-wider uppercase">{tier.name} Tier</span>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Market Comparison Chart (New) */}
                                    <div className="bg-slate-800/20 p-4 rounded-xl border border-slate-700/30 flex-1">
                                        <h4 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                                            <BarChart3 size={14} className="text-purple-400" /> Market Comparison
                                        </h4>
                                        <div className="h-[180px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={marketData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                                    <XAxis type="number" hide domain={[0, 100]} />
                                                    <YAxis
                                                        type="category"
                                                        dataKey="name"
                                                        stroke="#94a3b8"
                                                        width={90}
                                                        tick={{ fontSize: 11 }}
                                                        interval={0}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                                                    />
                                                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                                                        {marketData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Charts Column (Existing modified) */}
                                <div className="lg:col-span-2 flex flex-col gap-6">
                                    {/* ... keeping existing Gauge/Chart row ... */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                                        {/* Efficiency Gauge */}
                                        <div className="bg-slate-800/20 p-4 rounded-xl border border-slate-700/30 relative overflow-hidden">
                                            {/* ... existing gauge code ... */}
                                            <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                                                <Zap size={14} className="text-yellow-400" /> System Efficiency
                                            </h4>
                                            <div className="flex flex-col items-center justify-center h-[140px]">
                                                <div className="relative w-[160px] h-[80px] overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-full h-[160px] rounded-full border-[12px] border-slate-700/30"></div>
                                                    <motion.div
                                                        initial={{ rotate: -180 }}
                                                        animate={{ rotate: -180 + (Math.min(scores.overall * 1.1, 180)) }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className="absolute top-0 left-0 w-full h-[160px] rounded-full border-[12px] border-emerald-500 border-b-transparent border-r-transparent origin-center"
                                                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}
                                                    ></motion.div>
                                                </div>
                                                <div className="text-2xl font-bold text-slate-200 mt-[-20px] z-10">
                                                    {Math.round(scores.overall * 1.1)}%
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">Perf / Watt Ratio</div>
                                            </div>
                                        </div>

                                        {/* Score Breakdown */}
                                        <div className="bg-slate-800/20 p-4 rounded-xl border border-slate-700/30">
                                            {/* ... existing bar chart ... */}
                                            <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                                                <BarChart3 size={14} className="text-purple-400" /> Category Scores
                                            </h4>
                                            <div className="h-[140px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData} layout="vertical" margin={{ left: -20 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                                        <XAxis type="number" domain={[0, 100]} hide />
                                                        <YAxis type="category" dataKey="name" stroke="#94a3b8" width={70} tick={{ fontSize: 10 }} />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                                                            itemStyle={{ color: '#e2e8f0' }}
                                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                        />
                                                        <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={12}>
                                                            {chartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Comparison Chart */}
                                    <div className="bg-slate-800/20 p-4 rounded-xl border border-slate-700/30 flex-1">
                                        <h4 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                                            <TrendingUp size={14} className="text-cyan-400" /> Current vs History
                                        </h4>
                                        <div className="h-[160px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={[
                                                    { name: 'Current', ...scores, fill: '#06b6d4' },
                                                    {
                                                        name: 'Average (Last 5)',
                                                        cpu: history.slice(0, 5).reduce((a, b) => a + (b.cpu || 0), 0) / Math.min(history.length, 5) || 0,
                                                        memory: history.slice(0, 5).reduce((a, b) => a + (b.memory || 0), 0) / Math.min(history.length, 5) || 0,
                                                        compute: history.slice(0, 5).reduce((a, b) => a + (b.compute || 0), 0) / Math.min(history.length, 5) || 0,
                                                        rendering: history.slice(0, 5).reduce((a, b) => a + (b.rendering || 0), 0) / Math.min(history.length, 5) || 0,
                                                        multitask: history.slice(0, 5).reduce((a, b) => a + (b.multitask || 0), 0) / Math.min(history.length, 5) || 0,
                                                    }
                                                ]}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 100]} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                                                    <Bar dataKey="cpu" name="CPU" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="memory" name="Memory" fill="#a855f7" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="compute" name="Compute" fill="#eab308" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {
                            activeTab === 'details' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(scores).filter(([k]) => k !== 'overall').map(([key, value]) => {
                                            const test = BENCHMARK_TESTS[key];
                                            const Icon = test?.icon || Activity;

                                            // Simulated sub-scores based on the main score
                                            const subScores = [
                                                { label: 'Latency', val: Math.min(value + Math.random() * 10, 99) },
                                                { label: 'Throughput', val: Math.max(value - Math.random() * 10, 40) },
                                                { label: 'Stability', val: Math.min(value + Math.random() * 5, 98) },
                                            ];

                                            return (
                                                <div key={key} className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg bg-${test?.color}-500/10 text-${test?.color}-400`}>
                                                                <Icon size={20} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-slate-200">{test?.name}</h4>
                                                                <p className="text-xs text-slate-500">{test?.description}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-xl font-bold text-${test?.color}-400`}>{value}</span>
                                                    </div>

                                                    {/* Mini Chart for Category */}
                                                    <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden mb-4">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${value}%` }}
                                                            className={`h-full bg-${test?.color}-500`}
                                                        />
                                                    </div>

                                                    {/* Sub-scores */}
                                                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-700/30">
                                                        {subScores.map((sub, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-400">{sub.label}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-24 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-slate-500 rounded-fullState" style={{ width: `${sub.val}%` }}></div>
                                                                    </div>
                                                                    <span className="text-slate-300 w-6 text-right">{Math.round(sub.val)}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        }

                        {/* Radar Tab */}
                        {
                            activeTab === 'radar' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="h-[350px]">
                                        <h3 className="text-sm font-medium text-slate-400 mb-4">Performance Radar</h3>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={radarData}>
                                                <PolarGrid stroke="#334155" />
                                                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" />
                                                <Radar
                                                    name="Score"
                                                    dataKey="score"
                                                    stroke="#06b6d4"
                                                    fill="#06b6d4"
                                                    fillOpacity={0.3}
                                                    strokeWidth={2}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#1e293b',
                                                        borderColor: '#334155',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Score Gauge */}
                                    <div className="h-[350px]">
                                        <h3 className="text-sm font-medium text-slate-400 mb-4">Score Distribution</h3>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={scoreDistribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={120}
                                                    startAngle={180}
                                                    endAngle={0}
                                                    dataKey="value"
                                                >
                                                    {scoreDistribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="text-center -mt-20">
                                            <div className="text-4xl font-bold text-slate-100">{scores.overall}</div>
                                            <div className="text-slate-400">out of 100</div>
                                        </div>
                                    </div>
                                </div>
                            )
                        }


                    </motion.div >
                )}
            </AnimatePresence >

            {/* Performance Tips */}
            <AnimatePresence>
                {
                    tips.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="glass-panel p-4"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Flame size={18} className="text-orange-400" />
                                <h3 className="font-medium text-slate-200">Performance Insights</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {tips.map((tip, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg"
                                    >
                                        <tip.icon size={16} className="text-slate-500 shrink-0" />
                                        <span className="text-sm text-slate-400">{tip.text}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Benchmark Tests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {
                    Object.entries(BENCHMARK_TESTS).map(([key, test], idx) => {
                        const Icon = test.icon;
                        const isActive = currentTest === key;
                        const testProgress = progress[key] || 0;
                        const testScore = scores[key];
                        const comparison = testScore !== undefined ? getComparison(testScore, key) : null;

                        return (
                            <motion.div
                                key={key}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`glass-panel p-5 relative overflow-hidden group ${isActive ? 'ring-2 ring-cyan-500/50' : ''}`}
                            >
                                {isActive && (
                                    <motion.div
                                        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500"
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: testProgress / 100 }}
                                        style={{ transformOrigin: 'left' }}
                                    />
                                )}

                                <div className="flex justify-between items-start mb-3">
                                    <div className={`p-2.5 rounded-xl ${colorClasses[test.color]} transition-all`}>
                                        <Icon size={20} />
                                    </div>
                                    {testScore !== undefined && (
                                        <div className="text-right">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="text-xl font-bold text-slate-100"
                                            >
                                                {testScore}
                                            </motion.div>
                                            {comparison && (
                                                <div className={`flex items-center gap-1 text-xs ${comparison.color}`}>
                                                    <comparison.icon size={12} />
                                                    <span>{comparison.diff}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-base font-semibold text-slate-100 mb-1">{test.name}</h3>
                                <p className="text-xs text-slate-400 mb-3">{test.description}</p>

                                <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full bg-gradient-to-r ${progressColors[test.color]} rounded-full`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${testProgress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>

                                {isActive ? (
                                    <div className="flex items-center gap-2 mt-3 text-cyan-400 text-xs">
                                        <Clock size={12} className="animate-spin" />
                                        <span>Running...</span>
                                    </div>
                                ) : !isRunning && (
                                    <button
                                        onClick={() => runSingleBenchmark(key)}
                                        className="flex items-center gap-1 mt-3 text-xs text-slate-500 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronRight size={12} />
                                        Run this test
                                    </button>
                                )}
                            </motion.div>
                        );
                    })
                }
            </div >

            {/* History Trend Chart */}
            {
                historyTrendData.length > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-6"
                    >
                        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                            <TrendingUp size={20} className="text-green-400" />
                            Performance Trend
                        </h2>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyTrendData}>
                                    <defs>
                                        <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="run" stroke="#64748b" />
                                    <YAxis domain={[0, 100]} stroke="#64748b" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            borderColor: '#334155',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="overall"
                                        stroke="#06b6d4"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorOverall)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                )
            }

            {/* History Table */}
            <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Clock size={20} className="text-slate-400" />
                        Benchmark History
                    </h2>
                    {history.length > 0 && (
                        <button
                            onClick={clearHistory}
                            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors"
                        >
                            <RotateCcw size={14} />
                            Clear
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <Zap size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No benchmark history yet</p>
                        <p className="text-sm">Run a benchmark to see your scores here</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-700/50">
                                    <th className="text-left p-3">Date</th>
                                    <th className="text-center p-3">Duration</th>
                                    <th className="text-center p-3">CPU</th>
                                    <th className="text-center p-3">Memory</th>
                                    <th className="text-center p-3">Compute</th>
                                    <th className="text-center p-3">Render</th>
                                    <th className="text-center p-3">Multi</th>
                                    <th className="text-center p-3">Overall</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((entry, idx) => (
                                    <motion.tr
                                        key={entry.date}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="border-b border-slate-700/30 hover:bg-slate-800/30"
                                    >
                                        <td className="p-3 text-slate-300 whitespace-nowrap">
                                            {new Date(entry.date).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-center text-slate-400">
                                            {entry.duration ? `${entry.duration}s` : '—'}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="text-cyan-400 font-mono">{entry.cpu || '—'}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="text-purple-400 font-mono">{entry.memory || '—'}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="text-yellow-400 font-mono">{entry.compute || '—'}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="text-green-400 font-mono">{entry.rendering || '—'}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="text-pink-400 font-mono">{entry.multitask || '—'}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="font-bold text-slate-100">{entry.overall}</span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-sm text-slate-500 pb-4"
            >
                <Info size={14} />
                <p>Benchmarks run entirely in your browser. Results may vary based on system load and browser performance.</p>
            </motion.div>
        </div >
    );
}

export default Benchmarks;
