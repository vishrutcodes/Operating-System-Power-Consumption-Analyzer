import { useContext, useRef, useState, useEffect } from 'react';
import { MetricsContext } from '../App';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText } from 'lucide-react';
import ReportDocument from '../components/ReportDocument';

function readLocalJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
}

function Reports() {
    const { data, history } = useContext(MetricsContext);
    const componentRef = useRef();

    const benchmarks = readLocalJSON('powerpulse_benchmark_history', []);

    const energySettings = {
        region: readLocalJSON('powerpulse_energy_region', { name: 'India', rate: 6.5, currency: '\u20B9', co2: 0.82 }),
        systemType: localStorage.getItem('powerpulse_system_type') || 'laptop',
        dailyBudget: parseFloat(localStorage.getItem('powerpulse_daily_budget') || '5'),
    };

    const powerProfiles = {
        profiles: readLocalJSON('powerpulse_profiles', []),
        activeId: localStorage.getItem('powerpulse_active_profile') || 'balanced',
    };

    const [gpuInfo, setGpuInfo] = useState(null);
    useEffect(() => {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (gl) {
                const dbg = gl.getExtension('WEBGL_debug_renderer_info');
                setGpuInfo({
                    vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : 'Unknown',
                    renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'Unknown',
                    version: gl.getParameter(gl.VERSION),
                });
            }
        } catch { /* WebGL unavailable */ }
    }, []);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `OS_Power_Consumption_Analyzer_Report_${new Date().toISOString().slice(0, 10)}`,
    });

    if (!data) return null;

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex justify-between items-center bg-slate-800/40 p-6 rounded-xl border border-white/5 backdrop-blur-md">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">System Reports</h1>
                    <p className="text-slate-400 text-sm mt-1">Generate and export detailed system health diagnostics.</p>
                </div>
                <button
                    onClick={() => {
                        if (componentRef.current) {
                            handlePrint();
                        }
                    }}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
                >
                    <Printer size={20} /> Download PDF
                </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col items-center justify-center bg-white w-full relative" style={{ minHeight: '100vh' }}>
                <div className="absolute top-4 left-4 text-xs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} /> Print Preview
                </div>

                <div className="overflow-y-auto w-full h-full p-8 flex justify-center bg-white">
                    <div className="transform scale-[0.8] origin-top">
                        <ReportDocument
                            ref={componentRef}
                            data={data}
                            history={history}
                            benchmarks={benchmarks}
                            energySettings={energySettings}
                            powerProfiles={powerProfiles}
                            gpuInfo={gpuInfo}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Reports;
