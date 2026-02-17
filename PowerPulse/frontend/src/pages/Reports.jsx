import { useContext, useRef } from 'react';
import { MetricsContext } from '../App';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText } from 'lucide-react';
import ReportDocument from '../components/ReportDocument';

function Reports() {
    const { data, history } = useContext(MetricsContext);
    const componentRef = useRef();

    // Read benchmark history
    const benchmarks = (() => {
        try {
            return JSON.parse(localStorage.getItem('powerpulse_benchmark_history') || '[]');
        } catch {
            return [];
        }
    })();

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

                {/* Report Preview Container */}
                {/* Scaled down to fit screen, but prints full size */}
                <div className="overflow-y-auto w-full h-full p-8 flex justify-center bg-white">
                    <div className="transform scale-[0.8] origin-top">
                        <ReportDocument ref={componentRef} data={data} history={history} benchmarks={benchmarks} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Reports;
