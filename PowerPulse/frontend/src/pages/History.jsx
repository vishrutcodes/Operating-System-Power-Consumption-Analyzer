import { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { History as HistoryIcon, Database } from 'lucide-react';

const API_HISTORY = "http://127.0.0.1:8000/api/history";

const RANGE_PRESETS = [
    { hours: 1, label: '1h' },
    { hours: 6, label: '6h' },
    { hours: 24, label: '24h' },
    { hours: 168, label: '7d' },
];

function History() {
    const [data, setData] = useState([]);
    const [range, setRange] = useState(24); // hours
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_HISTORY}?hours=${range}`);
            const json = await res.json();
            // Convert timestamp to readable time string
            const formatted = json.map(d => ({
                ...d,
                timeLabel: new Date(d.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            setData(formatted);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }, [range]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const ChartSection = ({ title, dataKey1, color1, name1, dataKey2, color2, name2, unit }) => (
        <div className="glass-panel p-6 h-[300px] flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-slate-300">{title}</h3>
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`grad${dataKey1}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color1} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color1} stopOpacity={0} />
                            </linearGradient>
                            {dataKey2 && (
                                <linearGradient id={`grad${dataKey2}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color2} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color2} stopOpacity={0} />
                                </linearGradient>
                            )}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={30} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                            labelStyle={{ color: '#94a3b8' }}
                        />
                        <Legend />
                        <Area type="monotone" dataKey={dataKey1} stroke={color1} fill={`url(#grad${dataKey1})`} name={name1} unit={unit} />
                        {dataKey2 && <Area type="monotone" dataKey={dataKey2} stroke={color2} fill={`url(#grad${dataKey2})`} name={name2} unit={unit} />}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex justify-between items-center bg-slate-800/40 p-6 rounded-xl border border-white/5 backdrop-blur-md">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                        <HistoryIcon className="text-cyan-400" /> Historical Analysis
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Long-term trending data for system performance.</p>
                </div>

                <div className="flex bg-gradient-to-r from-sky-50 to-white rounded-xl p-1.5 border border-sky-200">
                    {RANGE_PRESETS.map(({ hours, label }) => (
                        <button
                            key={hours}
                            onClick={() => setRange(hours)}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${range === hours ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30' : 'text-slate-700 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/30'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400/20 border-t-cyan-400"></div>
                        <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-cyan-400/30"></div>
                    </div>
                </div>
            ) : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <Database size={48} className="mb-4 opacity-50" />
                    <p>No historical data yet.</p>
                    <p className="text-xs mt-2">Data is collected every 60 seconds.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pb-4">
                    <ChartSection
                        title="CPU Utilization"
                        dataKey1="cpu" color1="#22d3ee" name1="CPU %"
                    />
                    <ChartSection
                        title="Memory Usage"
                        dataKey1="memory" color1="#a855f7" name1="Memory %"
                    />
                    <ChartSection
                        title="Network Traffic (Bytes/sec)"
                        dataKey1="net_recv_rate" color1="#34d399" name1="Download"
                        dataKey2="net_sent_rate" color2="#3b82f6" name2="Upload"
                    />
                    <ChartSection
                        title="Disk I/O (Bytes/sec)"
                        dataKey1="disk_read_rate" color1="#f59e0b" name1="Read"
                        dataKey2="disk_write_rate" color2="#f43f5e" name2="Write"
                    />
                </div>
            )}
        </div>
    );
}

export default History;
