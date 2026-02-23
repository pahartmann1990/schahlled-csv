import React, { useState, useMemo } from 'react';
import { parseFile } from './utils/csvParser';
import { MainChart } from './components/MainChart';
import { generateExcelReport } from './utils/exportHelper';
import { ParsedData, ChartConfigState } from './types';
import { Upload, ChevronUp, ChevronLeft, ChevronRight, Lightbulb, Download, Trash2, FileSpreadsheet } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<ParsedData | null>(null);
  const [activeMetric, setActiveMetric] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'WEEK' | 'MONTH' | 'YEAR'>('YEAR');
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const parsed = await parseFile(file);
      setData(parsed);
      const firstMetric = parsed.headers.find(h => h !== 'Date');
      if (firstMetric) setActiveMetric(firstMetric);
    } catch (e) {
      alert("Fehler beim Laden der Datei. Bitte prüfen Sie das Format.");
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = useMemo((): ChartConfigState => ({
    xAxisKey: 'Date',
    activeLines: activeMetric ? [activeMetric] : [],
    showGrid: true,
    filterStart: '',
    filterEnd: ''
  }), [activeMetric]);

  const totalValue = useMemo(() => {
    if (!data || !activeMetric) return "0";
    const sum = data.rows.reduce((acc, row) => acc + (Number(row[activeMetric]) || 0), 0);
    return sum.toLocaleString('de-DE', { maximumFractionDigits: 1 });
  }, [data, activeMetric]);

  const unit = useMemo(() => {
    const lowMetric = activeMetric.toLowerCase();
    if (lowMetric.includes('kwh')) return 'kWh';
    if (lowMetric.includes('%')) return '%';
    if (lowMetric.includes('eur') || lowMetric.includes('cost')) return 'EUR';
    if (lowMetric.includes('kg') || lowMetric.includes('co2')) return 'kg';
    return '';
  }, [activeMetric]);

  const handleExportExcel = async () => {
    if (!data) return;
    setLoading(true);
    try {
      await generateExcelReport(data, chartConfig, data.rows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {!data ? (
        <div className="bg-white p-12 rounded-[40px] shadow-2xl max-w-lg w-full text-center border border-slate-200">
          <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Upload className="text-emerald-600 w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-4 tracking-tight uppercase">Energy Control</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Wählen Sie Ihre CSV oder Excel Datei aus,<br/>um die Messdaten zu visualisieren.
          </p>
          
          <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 px-10 rounded-2xl cursor-pointer transition-all inline-flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 active:scale-95 w-full mb-8">
            {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <FileSpreadsheet size={24} />}
            {loading ? 'WIRD ANALYSIERT...' : 'DATEI JETZT HOCHLADEN'}
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} accept=".csv,.xlsx,.xls" />
          </label>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-[11px] text-slate-400 leading-tight">
            <p className="font-bold text-slate-500 uppercase mb-1 tracking-wider">Erforderliches Format:</p>
            <p>Ihre Tabelle sollte eine Spalte 'Date' und beliebig viele numerische Messwert-Spalten enthalten.</p>
          </div>
        </div>
      ) : (
        <div 
          className="bg-[#78b800] w-full max-w-[1300px] aspect-[16/10] rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col p-10 relative"
        >
          {/* Header */}
          <div className="flex flex-col items-center text-white mb-6">
            <div className="flex items-center gap-4 mb-2">
              <ChevronUp className="w-8 h-8 opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/10 rounded-full">
                <Lightbulb className="w-10 h-10 text-yellow-300 fill-yellow-300/20" />
              </div>
              <h2 className="text-4xl font-light tracking-[0.25em] uppercase">Energy Usage</h2>
            </div>
            <div className="flex items-center gap-16 mt-8">
              <ChevronLeft className="w-10 h-10 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
              <span className="text-2xl font-semibold tracking-[0.3em]">2025</span>
              <ChevronRight className="w-10 h-10 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex gap-8 mb-6 items-start">
            {/* Value Display */}
            <div className="w-[40%] bg-white rounded-[40px] p-12 h-[460px] flex flex-col justify-between items-center shadow-2xl border border-white/20">
              <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-widest opacity-80 text-center">{activeMetric}</h3>
              <div className="flex flex-col items-center">
                <span className="text-[110px] font-light text-slate-900 leading-none tracking-tighter">{totalValue}</span>
                <span className="text-4xl font-medium text-slate-400 mt-2">{unit}</span>
              </div>
              <div className="h-2 w-24 bg-emerald-500 rounded-full" />
            </div>

            {/* Chart Area */}
            <div className="w-[60%] flex flex-col gap-6 h-[460px]">
              <div className="flex-1 bg-white rounded-[40px] p-10 shadow-2xl border border-white/20 overflow-hidden relative">
                <MainChart data={data.rows} config={chartConfig} isDashboardMode={true} />
              </div>
              
              {/* Massive Export Button */}
              <button 
                onClick={handleExportExcel}
                className="w-full bg-white hover:bg-slate-50 text-emerald-700 font-black py-6 rounded-[30px] shadow-xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] border-2 border-emerald-100 group"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                ) : <Download size={28} className="text-emerald-600 group-hover:translate-y-0.5 transition-transform" />}
                <span className="text-xl tracking-wider uppercase">Excel-Report herunterladen</span>
              </button>
            </div>
          </div>

          {/* Controls Footer */}
          <div className="flex justify-between items-center mt-auto pt-6 border-t border-white/10">
            <div className="flex gap-3 bg-white/10 p-1.5 rounded-2xl">
              {['WEEK', 'MONTH', 'YEAR'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`text-[11px] font-bold py-3 px-8 rounded-xl uppercase tracking-[0.2em] transition-all ${timeRange === range ? 'bg-white text-emerald-700 shadow-xl' : 'text-white hover:bg-white/10'}`}
                >
                  {range}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-2 max-w-[60%]">
              {data.headers.filter(h => h !== 'Date').map(metric => (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  className={`text-[10px] font-bold py-2 px-5 rounded-lg uppercase tracking-[0.1em] transition-all border ${activeMetric === metric ? 'bg-white text-emerald-700 border-white shadow-md' : 'bg-transparent text-white border-white/20 hover:bg-white/5'}`}
                >
                  {metric}
                </button>
              ))}
              <button 
                onClick={() => { if(confirm("Möchten Sie das Dashboard wirklich zurücksetzen?")) setData(null); }}
                className="text-[10px] font-bold py-2 px-5 rounded-lg uppercase tracking-[0.1em] bg-red-500/20 text-red-100 border border-red-500/30 hover:bg-red-500/40 transition-all flex items-center gap-2"
              >
                <Trash2 size={12} /> Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
