import React, { useState, useMemo, useRef } from 'react';
import { parseFile } from './utils/csvParser';
import { MainChart } from './components/MainChart';
import { ParsedData, ChartConfigState } from './types';
import { Upload, ChevronUp, ChevronLeft, ChevronRight, Lightbulb, Download, FileText, Image as ImageIcon } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

const App: React.FC = () => {
  const [data, setData] = useState<ParsedData | null>(null);
  const [activeMetric, setActiveMetric] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'WEEK' | 'MONTH' | 'YEAR'>('YEAR');
  const [loading, setLoading] = useState(false);
  
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const parsed = await parseFile(file);
      setData(parsed);
      // Auto-select first non-date metric
      const firstMetric = parsed.headers.find(h => h !== 'Date' && h !== 'metric' && h !== 'label');
      if (firstMetric) setActiveMetric(firstMetric);
    } catch (e) {
      alert("Fehler beim Laden der Datei.");
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
    return sum.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  }, [data, activeMetric]);

  const unit = useMemo(() => {
    if (activeMetric.includes('kWh')) return 'kWh';
    if (activeMetric.includes('%')) return '%';
    if (activeMetric.includes('EUR') || activeMetric.includes('Cost')) return 'EUR';
    if (activeMetric.includes('kg') || activeMetric.includes('CO2')) return 'kg';
    return '';
  }, [activeMetric]);

  const downloadPNG = async () => {
    if (dashboardRef.current) {
      const dataUrl = await htmlToImage.toPng(dashboardRef.current);
      const link = document.createElement('a');
      link.download = 'energy-usage-dashboard.png';
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      {!data ? (
        <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-lg w-full text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload className="text-green-600 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Energie Dashboard</h1>
          <p className="text-gray-500 mb-8">Laden Sie Ihre CSV oder Excel Datei hoch, um die Analyse zu starten.</p>
          <label className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl cursor-pointer transition-all inline-block">
            {loading ? 'Lade...' : 'DATEI WÄHLEN'}
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} accept=".csv,.xlsx" />
          </label>
        </div>
      ) : (
        <div 
          ref={dashboardRef}
          className="bg-[#78b800] w-full max-w-[1200px] aspect-[16/10] rounded-[40px] shadow-2xl overflow-hidden flex flex-col p-8 relative"
        >
          {/* Header */}
          <div className="flex flex-col items-center text-white mb-4">
            <div className="flex items-center gap-4 mb-2">
              <ChevronUp className="w-8 h-8 opacity-80 cursor-pointer" />
            </div>
            <div className="flex items-center gap-3">
              <Lightbulb className="w-10 h-10" />
              <h2 className="text-3xl font-light tracking-[0.2em] uppercase">Energy Usage</h2>
            </div>
            <div className="flex items-center gap-12 mt-6">
              <ChevronLeft className="w-8 h-8 opacity-80 cursor-pointer" />
              <span className="text-xl font-medium tracking-widest">2025</span>
              <ChevronRight className="w-8 h-8 opacity-80 cursor-pointer" />
            </div>
          </div>

          {/* Download Buttons Area */}
          <div className="absolute right-12 top-[280px] z-10 flex gap-4">
            <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold py-1 px-3 rounded uppercase tracking-wider transition-colors">
              <Download size={12} /> Download CSV
            </button>
            <button 
              onClick={downloadPNG}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold py-1 px-3 rounded uppercase tracking-wider transition-colors"
            >
              <Download size={12} /> Download PNG
            </button>
          </div>

          {/* Main Dashboard Content */}
          <div className="flex-1 flex gap-8 mb-4 items-start">
            {/* Left Card: Big Number */}
            <div className="w-[45%] bg-white rounded-[30px] p-12 h-[450px] flex flex-col justify-center items-center shadow-lg">
              <h3 className="text-3xl font-bold text-gray-800 uppercase tracking-wide mb-8">Energy Usage</h3>
              <div className="flex items-baseline gap-4">
                <span className="text-[120px] font-light text-gray-800 leading-none">{totalValue}</span>
                <span className="text-4xl font-normal text-gray-700">{unit}</span>
              </div>
            </div>

            {/* Right Card: Chart */}
            <div className="w-[55%] bg-white rounded-[30px] p-8 h-[450px] shadow-lg overflow-hidden">
               <MainChart data={data.rows} config={chartConfig} isDashboardMode={true} />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex justify-between items-end mt-4">
            {/* Timeframe Select */}
            <div className="flex gap-2">
              {['WEEK', 'MONTH', 'YEAR'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`text-[10px] font-bold py-2 px-6 rounded-lg uppercase tracking-widest transition-all ${timeRange === range ? 'bg-white/40 text-white shadow-inner' : 'bg-white/20 text-white/80 hover:bg-white/30'}`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Metric Select */}
            <div className="flex flex-wrap justify-end gap-2 max-w-[60%]">
              {data.headers.filter(h => h !== 'Date').map(metric => (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  className={`text-[10px] font-bold py-2 px-6 rounded-lg uppercase tracking-widest transition-all ${activeMetric === metric ? 'bg-white/40 text-white shadow-inner' : 'bg-white/20 text-white/80 hover:bg-white/30'}`}
                >
                  {metric}
                </button>
              ))}
              <button 
                onClick={() => setData(null)}
                className="text-[10px] font-bold py-2 px-6 rounded-lg uppercase tracking-widest bg-black/20 text-white hover:bg-black/30"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
