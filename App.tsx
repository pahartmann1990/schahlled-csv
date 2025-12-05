import React, { useState, useCallback, useRef, useMemo } from 'react';
import { FileUploader } from './components/FileUploader';
import { ControlPanel } from './components/ControlPanel';
import { MainChart } from './components/MainChart';
import { parseFile, mergeDatasets } from './utils/csvParser';
import { generateExcelReport } from './utils/exportHelper';
import { ParsedData, ChartConfigState, ProjectFile } from './types';
import { Table, AlertCircle, Save, FolderOpen, Plus, FileText, Download, Play, Filter } from 'lucide-react';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [data, setData] = useState<ParsedData | null>(null);
  const [config, setConfig] = useState<ChartConfigState>({ 
      xAxisKey: '', 
      activeLines: [],
      showGrid: true,
      filterStart: '',
      filterEnd: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const [loading, setLoading] = useState(false);
  
  const projectInputRef = useRef<HTMLInputElement>(null);
  const appendInputRef = useRef<HTMLInputElement>(null);

  // Filter Data Logic
  const filteredRows = useMemo(() => {
    if (!data) return [];
    
    // If no filter, return all
    if (!config.filterStart && !config.filterEnd) return data.rows;

    return data.rows.filter(row => {
        const val = row[config.xAxisKey];
        // Only filter if value looks like a date/string
        if (typeof val !== 'string') return true;

        const rowDate = val; // Assuming date string matching sortable format or ISO
        
        // Simple string comparison works for ISO YYYY-MM-DD
        // For mixed formats, we might need Date.parse, but the parser already sorted them.
        // Let's rely on standard lex comparisons for ISO dates which is robust
        
        let passStart = true;
        let passEnd = true;

        if (config.filterStart) {
            passStart = rowDate >= config.filterStart;
        }
        if (config.filterEnd) {
            passEnd = rowDate <= config.filterEnd;
        }

        return passStart && passEnd;
    });
  }, [data, config.filterStart, config.filterEnd, config.xAxisKey]);

  const handleInitialUpload = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
        const parsed = await parseFile(file);
        
        if (parsed.headers.length === 0 || parsed.rows.length === 0) {
          setError(`Die Datei ${file.name} scheint leer oder ungültig zu sein.`);
          setLoading(false);
          return;
        }

        setData(parsed);
        
        // Detect X-Axis
        const lowerHeaders = parsed.headers.map(h => h.toLowerCase());
        const timeIndex = lowerHeaders.findIndex(h => h.includes('time') || h.includes('datum') || h.includes('date') || h.includes('zeit'));
        const xKey = timeIndex !== -1 ? parsed.headers[timeIndex] : parsed.headers[0];
        
        // Auto-select numeric columns for chart
        const potentialLines = parsed.headers.filter(h => h !== xKey).filter(h => {
            const firstVal = parsed.rows.find(r => r[h] !== undefined && r[h] !== null)?.[h];
            return typeof firstVal === 'number';
        }).slice(0, 5);

        setConfig(prev => ({
          ...prev,
          xAxisKey: xKey,
          activeLines: potentialLines
        }));

        // Switch tab based on type
        if (!parsed.hasTimeAxis) {
            setActiveTab('table');
        } else {
            setActiveTab('chart');
        }

    } catch (err: any) {
        console.error(err);
        setError("Fehler beim Lesen der Datei: " + (err.message || "Unbekannter Fehler"));
    } finally {
        setLoading(false);
    }
  }, []);

  const handleAppendUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !data) return;
      
      setLoading(true);
      try {
          const newData = await parseFile(file);
          const merged = mergeDatasets(data, newData);
          setData(merged);
          alert(`${newData.rows.length} Zeilen hinzugefügt.`);
      } catch (err: any) {
          setError(err.message || "Fehler beim Zusammenfügen.");
      } finally {
          setLoading(false);
      }
      
      if (e.target.value) e.target.value = '';
  };

  const handleSaveProject = () => {
      if (!data) return;
      const project: ProjectFile = {
          version: '1.0',
          type: 'schal-led-project',
          data,
          config,
          savedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SchalLED_Projekt_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleLoadProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoading(true);
      try {
          const text = await file.text();
          const project: ProjectFile = JSON.parse(text);
          
          if (project.type !== 'schal-led-project' || !project.data) {
              throw new Error("Ungültiges Projektformat");
          }

          setData(project.data);
          setConfig(project.config);
          setError(null);
      } catch (err) {
          setError("Projektdatei konnte nicht gelesen werden.");
      } finally {
          setLoading(false);
      }
      if (e.target.value) e.target.value = '';
  };

  const handleExportExcel = async () => {
      if (!data) return;
      setLoading(true);
      try {
          await generateExcelReport(data, config, filteredRows);
      } catch (e) {
          console.error(e);
          alert("Fehler beim Erstellen der Excel-Datei");
      } finally {
          setLoading(false);
      }
  };

  const handleReset = () => {
    if (window.confirm("Alles zurücksetzen?")) {
        setData(null);
        setConfig({ xAxisKey: '', activeLines: [], showGrid: true, filterStart: '', filterEnd: '' });
        setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-900">
      <input type="file" ref={projectInputRef} onChange={handleLoadProject} accept=".json" className="hidden" />
      <input type="file" ref={appendInputRef} onChange={handleAppendUpload} accept=".csv, .xlsx, .xls" className="hidden" />

      {/* Header */}
      <header className="bg-white border-b border-green-600 sticky top-0 z-20 shadow-md">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-green-700 p-2 rounded-lg shadow-sm">
                <Table className="h-6 w-6 text-white" />
             </div>
             <div>
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                    SCHAL <span className="text-green-600">LED</span> CONTROL CENTER
                </h1>
                {data && (
                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <FileText className="w-3 h-3 mr-1" />
                        {data.fileName || 'Unbenannt'} 
                    </div>
                )}
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             {!data ? (
                 <Button variant="secondary" onClick={() => projectInputRef.current?.click()} icon={<FolderOpen size={16} />}>
                     Projekt laden
                 </Button>
             ) : (
                 <>
                    <Button variant="secondary" onClick={() => appendInputRef.current?.click()} icon={<Plus size={16} />} title="Weitere Datei anfügen">
                       Merge
                    </Button>
                    <Button variant="secondary" onClick={handleSaveProject} icon={<Save size={16} />}>
                       Speichern
                    </Button>
                    <Button variant="primary" onClick={handleExportExcel} icon={<Download size={16} />} className="bg-green-600 hover:bg-green-700">
                       Excel Report
                    </Button>
                 </>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
            <div>
                <h3 className="text-sm font-medium text-red-800">Fehler</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {!data ? (
          <div className="max-w-xl mx-auto mt-24">
             <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-3">Daten Import</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Laden Sie Ihre CSV- oder Excel-Dateien zur Analyse hoch. Das System erkennt automatisch Zeitreihen oder Inventarlisten.
                </p>
                
                <FileUploader onFileUpload={handleInitialUpload} isLoading={loading} />
             </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            
            {/* Sidebar Controls - Only show if it's a Chart-type file */}
            {data.hasTimeAxis && (
                <div className="w-full lg:w-80 flex-shrink-0 h-full overflow-hidden flex flex-col">
                <ControlPanel 
                    data={data} 
                    config={config} 
                    onConfigChange={setConfig} 
                    onReset={handleReset}
                />
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 flex flex-col h-full min-w-0">
               {/* Tabs */}
               <div className="flex justify-between items-center mb-4">
                   <div className="flex space-x-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        {data.hasTimeAxis && (
                            <button 
                            onClick={() => setActiveTab('chart')}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'chart' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                            <Play className="w-4 h-4 mr-2" /> Diagramm
                            </button>
                        )}
                        <button 
                          onClick={() => setActiveTab('table')}
                          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'table' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                          <Table className="w-4 h-4 mr-2" /> Datentabelle
                        </button>
                   </div>
                   
                   {(config.filterStart || config.filterEnd) && (
                       <div className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200 flex items-center">
                           <Filter className="w-3 h-3 mr-2" />
                           Filter aktiv: {filteredRows.length} von {data.rows.length} Zeilen
                       </div>
                   )}
               </div>

              {activeTab === 'chart' && data.hasTimeAxis ? (
                 <MainChart data={filteredRows} config={config} />
              ) : (
                 <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden flex-1 flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Listenansicht</h3>
                        <span className="text-xs text-gray-400 font-mono">Zeigt {filteredRows.length} Einträge</span>
                    </div>
                    <div className="overflow-auto flex-1 p-0 custom-scrollbar relative">
                       <table className="min-w-full divide-y divide-gray-200 border-collapse">
                          <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
                             <tr>
                                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12 border-r border-gray-200">#</th>
                                {data.headers.map(h => (
                                   <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50 border-r border-gray-200 last:border-0">
                                      {h}
                                   </th>
                                ))}
                             </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                             {filteredRows.slice(0, 500).map((row, i) => ( 
                                <tr key={i} className="hover:bg-green-50 transition-colors group">
                                   <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-400 font-mono border-r border-gray-100 bg-gray-50 group-hover:bg-green-50">{i + 1}</td>
                                   {data.headers.map(h => (
                                      <td key={`${i}-${h}`} className="px-6 py-2 whitespace-nowrap text-sm text-gray-600 font-mono border-r border-gray-100 last:border-0">
                                         {row[h]}
                                      </td>
                                   ))}
                                </tr>
                             ))}
                          </tbody>
                       </table>
                       {filteredRows.length > 500 && (
                           <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 border-t sticky bottom-0">
                               Vorschau begrenzt auf 500 Zeilen. (Der Excel-Export enthält alle {filteredRows.length} Zeilen)
                           </div>
                       )}
                    </div>
                 </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; 
        }
      `}</style>
    </div>
  );
};

export default App;