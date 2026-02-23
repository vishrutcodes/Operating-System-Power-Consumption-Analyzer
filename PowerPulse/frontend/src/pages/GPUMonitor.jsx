import { useContext, useState, useEffect, useMemo, useRef } from 'react';
import { MetricsContext } from '../App';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
    Monitor, Thermometer, Zap, Cpu, MemoryStick, Activity,
    TrendingUp, AlertTriangle, Info, Gauge, Layers, Eye
} from 'lucide-react';

function estimateGPUUsage(processes) {
    const gpuHeavyPatterns = [
        /chrome/i, /firefox/i, /edge/i, /safari/i, /brave/i,
        /explorer/i, /dwm/i, /csrss/i, /compositor/i,
        /blender/i, /premiere/i, /resolve/i, /aftereffects/i,
        /unity/i, /unreal/i, /godot/i, /steam/i, /game/i,
        /nvidia/i, /amd/i, /intel.*gpu/i,
        /vlc/i, /mpv/i, /mpc/i, /obs/i, /streamlabs/i,
        /vscode/i, /code/i, /cursor/i, /electron/i,
    ];

    let totalGpuEstimate = 0;
    const gpuProcesses = [];

    (processes || []).forEach(p => {
        const isGpuProcess = gpuHeavyPatterns.some(pat => pat.test(p.name));
        if (isGpuProcess || p.cpu_percent > 5) {
            const weight = isGpuProcess ? 0.6 : 0.1;
            const gpuEst = Math.min(p.cpu_percent * weight, 40);
            if (gpuEst > 0.5) {
                totalGpuEstimate += gpuEst;
                gpuProcesses.push({ name: p.name, pid: p.pid, gpuPercent: parseFloat(gpuEst.toFixed(1)) });
            }
        }
    });

    return {
        usage: Math.min(totalGpuEstimate, 100),
        processes: gpuProcesses.sort((a, b) => b.gpuPercent - a.gpuPercent).slice(0, 10),
    };
}

function GPUMonitor() {
    const { data, isConnected } = useContext(MetricsContext);
    const [gpuInfo, setGpuInfo] = useState(null);
    const [gpuHistory, setGpuHistory] = useState([]);
    const [tempHistory, setTempHistory] = useState([]);
    const canvasRef = useRef(null);
    const [renderFPS, setRenderFPS] = useState(0);

    useEffect(() => {
        async function detectGPU() {
            const info = { vendor: 'Unknown', renderer: 'Unknown', tier: 'Unknown' };

            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                if (gl) {
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    if (debugInfo) {
                        info.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                        info.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    }
                    info.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                    info.maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
                    info.version = gl.getParameter(gl.VERSION);
                    info.shadingLang = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
                }
            } catch { /* WebGL not available */ }

            if (info.renderer.toLowerCase().includes('rtx') || info.renderer.toLowerCase().includes('rx 7'))
                info.tier = 'High-End';
            else if (info.renderer.toLowerCase().includes('gtx') || info.renderer.toLowerCase().includes('rx 6'))
                info.tier = 'Mid-Range';
            else if (info.renderer.toLowerCase().includes('intel') || info.renderer.toLowerCase().includes('integrated'))
                info.tier = 'Integrated';
            else
                info.tier = 'Standard';

            setGpuInfo(info);
        }
        detectGPU();
    }, []);

    const gpuEstimate = useMemo(() => estimateGPUUsage(data?.processes), [data?.processes]);
    const gpuUsage = gpuEstimate.usage;

    const estimatedTemp = useMemo(() => {
        const baseTemp = 35;
        const loadTemp = gpuUsage * 0.55;
        const ambient = data?.thermal?.avg_temp ? (data.thermal.avg_temp - 40) * 0.3 : 0;
        return Math.round(baseTemp + loadTemp + ambient);
    }, [gpuUsage, data?.thermal]);

    const estimatedPower = useMemo(() => {
        const tdp = gpuInfo?.tier === 'High-End' ? 250 : gpuInfo?.tier === 'Mid-Range' ? 150 : gpuInfo?.tier === 'Integrated' ? 25 : 75;
        const idle = tdp * 0.1;
        return parseFloat((idle + (tdp - idle) * (gpuUsage / 100)).toFixed(1));
    }, [gpuUsage, gpuInfo]);

    const vramEstimate = useMemo(() => {
        if (!gpuInfo) return { total: 0, used: 0 };
        const total = gpuInfo.tier === 'High-End' ? 12288 : gpuInfo.tier === 'Mid-Range' ? 8192 : gpuInfo.tier === 'Integrated' ? 2048 : 4096;
        const used = Math.round(total * (gpuUsage / 100) * 0.7 + total * 0.15);
        return { total, used: Math.min(used, total) };
    }, [gpuUsage, gpuInfo]);

    useEffect(() => {
        if (!data) return;
        const interval = setInterval(() => {
            const now = new Date().toLocaleTimeString();
            setGpuHistory(prev => [...prev, { time: now, usage: parseFloat(gpuUsage.toFixed(1)), power: estimatedPower }].slice(-60));
            setTempHistory(prev => [...prev, { time: now, temp: estimatedTemp }].slice(-60));
        }, 2000);
        return () => clearInterval(interval);
    }, [data, gpuUsage, estimatedPower, estimatedTemp]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let frameCount = 0;
        let lastTime = performance.now();
        let animId;

        const draw = (time) => {
            frameCount++;
            if (time - lastTime >= 1000) {
                setRenderFPS(frameCount);
                frameCount = 0;
                lastTime = time;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const particleCount = Math.max(5, Math.floor(gpuUsage / 3));
            for (let i = 0; i < particleCount; i++) {
                const x = (Math.sin(time * 0.001 + i * 0.7) * 0.5 + 0.5) * canvas.width;
                const y = (Math.cos(time * 0.0013 + i * 0.5) * 0.5 + 0.5) * canvas.height;
                const r = 2 + Math.sin(time * 0.002 + i) * 2;
                const hue = 180 + (i * 12) % 60;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.6)`;
                ctx.fill();
            }

            animId = requestAnimationFrame(draw);
        };
        animId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animId);
    }, [gpuUsage]);

    const getTempColor = (t) => t > 80 ? 'text-red-400' : t > 65 ? 'text-yellow-400' : 'text-green-400';
    const getUsageColor = (u) => u > 80 ? 'text-red-400' : u > 50 ? 'text-yellow-400' : 'text-cyan-400';

    if (!data) return null;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                        <Monitor className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">GPU Monitor</h1>
                        <p className="text-sm text-slate-400">Graphics processor usage, temperature & performance</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <Info size={14} className="text-slate-500" />
                    <span className="text-xs text-slate-500">Estimated via process analysis</span>
                </div>
            </motion.div>

            {/* GPU Info Card */}
            {gpuInfo && (
                <div className="glass-panel p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase mb-1">GPU</div>
                            <div className="text-sm font-medium text-slate-200 break-words">{gpuInfo.renderer}</div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase mb-1">Vendor</div>
                            <div className="text-sm font-medium text-slate-200">{gpuInfo.vendor}</div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase mb-1">Tier</div>
                            <div className={`text-sm font-medium ${gpuInfo.tier === 'High-End' ? 'text-green-400' : gpuInfo.tier === 'Mid-Range' ? 'text-cyan-400' : 'text-slate-300'}`}>{gpuInfo.tier}</div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase mb-1">WebGL</div>
                            <div className="text-sm font-medium text-slate-200">{gpuInfo.version || 'N/A'}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Activity size={14} className="text-cyan-400" /> Usage
                    </div>
                    <div className={`text-3xl font-bold ${getUsageColor(gpuUsage)}`}>{gpuUsage.toFixed(0)}<span className="text-sm font-normal text-slate-500">%</span></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Thermometer size={14} className="text-orange-400" /> Temp
                    </div>
                    <div className={`text-3xl font-bold ${getTempColor(estimatedTemp)}`}>{estimatedTemp}<span className="text-sm font-normal text-slate-500">°C</span></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Zap size={14} className="text-yellow-400" /> Power
                    </div>
                    <div className="text-3xl font-bold text-yellow-400">{estimatedPower}<span className="text-sm font-normal text-slate-500">W</span></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <MemoryStick size={14} className="text-purple-400" /> VRAM
                    </div>
                    <div className="text-2xl font-bold text-purple-400">{(vramEstimate.used / 1024).toFixed(1)}<span className="text-sm font-normal text-slate-500">/{(vramEstimate.total / 1024).toFixed(0)} GB</span></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Eye size={14} className="text-green-400" /> Render FPS
                    </div>
                    <div className="text-3xl font-bold text-green-400">{renderFPS}</div>
                </motion.div>
            </div>

            {/* GPU Usage & Temp Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {gpuHistory.length > 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6">
                        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                            <TrendingUp size={18} className="text-cyan-400" /> GPU Usage & Power
                        </h3>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={gpuHistory}>
                                    <defs>
                                        <linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                                    <Area type="monotone" dataKey="usage" name="Usage %" stroke="#a855f7" strokeWidth={2} fill="url(#colorGpu)" />
                                    <Area type="monotone" dataKey="power" name="Power W" stroke="#eab308" strokeWidth={1.5} fill="none" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                )}

                {tempHistory.length > 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6">
                        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                            <Thermometer size={18} className="text-orange-400" /> Temperature Trend
                        </h3>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={tempHistory}>
                                    <defs>
                                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[20, 100]} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                                    <Area type="monotone" dataKey="temp" name="Temp °C" stroke="#f97316" strokeWidth={2} fill="url(#colorTemp)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* VRAM Usage Bar */}
            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <MemoryStick size={18} className="text-purple-400" /> VRAM Usage
                </h3>
                <div className="mb-3">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">{(vramEstimate.used / 1024).toFixed(2)} GB used</span>
                        <span className="text-slate-400">{(vramEstimate.total / 1024).toFixed(0)} GB total</span>
                    </div>
                    <div className="h-6 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(vramEstimate.used / vramEstimate.total) * 100}%` }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        />
                    </div>
                </div>
            </div>

            {/* GPU Render Test Canvas */}
            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <Gauge size={18} className="text-green-400" /> Live GPU Render Test
                </h3>
                <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700/50">
                    <canvas ref={canvasRef} width={800} height={150} className="w-full h-[150px]" />
                </div>
                <div className="flex justify-between mt-3 text-xs text-slate-500">
                    <span>Particles rendered: {Math.max(5, Math.floor(gpuUsage / 3))}</span>
                    <span>Canvas FPS: {renderFPS}</span>
                </div>
            </div>

            {/* GPU Process List */}
            {gpuEstimate.processes.length > 0 && (
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                        <Layers size={18} className="text-cyan-400" /> GPU-Active Processes
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-700/50">
                                    <th className="text-left p-3">Process</th>
                                    <th className="text-center p-3">PID</th>
                                    <th className="text-right p-3">Est. GPU %</th>
                                    <th className="text-right p-3">Bar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gpuEstimate.processes.map((p, i) => (
                                    <tr key={p.pid} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                                        <td className="p-3 text-slate-300 font-medium">{p.name}</td>
                                        <td className="p-3 text-center text-slate-500 font-mono">{p.pid}</td>
                                        <td className="p-3 text-right font-mono text-purple-400">{p.gpuPercent}%</td>
                                        <td className="p-3">
                                            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden ml-auto">
                                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(p.gpuPercent * 2.5, 100)}%` }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GPUMonitor;
