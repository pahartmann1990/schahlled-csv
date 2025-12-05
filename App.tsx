import React, { useState, useCallback, useRef } from 'react';
import { FileUploader } from './components/FileUploader';
import { ControlPanel } from './components/ControlPanel';
import { MainChart } from './components/MainChart';
import { parseFile, mergeDatasets } from './utils/csvParser';
import { ParsedData, ChartConfigState, ProjectFile } from './types';
import { Table, AlertCircle, Save, FolderOpen, Plus, FileText, Download, Play } from 'lucide-react';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [data, setData] = useState<ParsedData | null>(null);
  const [config, setConfig] = useState<ChartConfigState>({ 
      xAxisKey: '', 
      activeLines: [],
      smoothing: 0,
      showGrid: true,
      strokeWidth: 2
  });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const [loading, setLoading] = useState(false);
  
  // Ref for hidden file input for project loading
  const projectInputRef = useRef<HTMLInputElement>(null);
  const appendInputRef = useRef<HTMLInputElement>(null);

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
        
        // Smart Default Configuration
        const lowerHeaders = parsed.headers.map(h => h.toLowerCase());
        const timeIndex = lowerHeaders.findIndex(h => h.includes('time') || h.includes('datum') || h.includes('date') || h.includes('index') || h.includes('zeit'));
        const xKey = timeIndex !== -1 ? parsed.headers[timeIndex] : parsed.headers[0];
        
        // Try to find numeric columns
        const potentialLines = parsed.headers.filter(h => h !== xKey).filter(h => {
            const firstVal = parsed.rows.find(r => r[h] !== undefined && r[h] !== null)?.[h];
            return typeof firstVal === 'number';
        }).slice(0, 3);

        setConfig(prev => ({
          ...prev,
          xAxisKey: xKey,
          activeLines: potentialLines
        }));
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
          
          // Auto-Sort rows if X-Axis is set
          if (config.xAxisKey) {
             const sortedRows = [...merged.rows].sort((a, b) => {
                 const valA = a[config.xAxisKey];
                 const valB = b[config.xAxisKey];
                 if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
                 if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB);
                 return 0;
             });
             setData({...merged, rows: sortedRows});
          }
          alert(`${newData.rows.length} Zeilen erfolgreich synchronisiert/angefügt!`);
      } catch (err: any) {
          setError(err.message || "Fehler beim Zusammenfügen der Daten.");
      } finally {
          setLoading(false);
      }
      
      if (e.target.value) e.target.value = '';
  };

  const handleSaveProject = () => {
      if (!data) return;
      const project: ProjectFile = {
          version: '1.0',
          type: 'csv-visualizer-project',
          data,
          config,
          savedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Projekt_${data.fileName?.split('.')[0] || 'Analyse'}.json`;
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
          
          if (project.type !== 'csv-visualizer-project' || !project.data || !project.config) {
              throw new Error("Ungültiges Projektformat");
          }

          setData(project.data);
          setConfig(project.config);
          setError(null);
      } catch (err) {
          setError("Die Projektdatei konnte nicht geladen werden. Stellen Sie sicher, dass es eine gültige .json Datei ist.");
      } finally {
          setLoading(false);
      }
      if (e.target.value) e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm("Möchten Sie das aktuelle Projekt wirklich schließen? Nicht gespeicherte Änderungen gehen verloren.")) {
        setData(null);
        setConfig({ xAxisKey: '', activeLines: [], smoothing: 0, showGrid: true, strokeWidth: 2 });
        setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-900">
      {/* Hidden Inputs */}
      <input type="file" ref={projectInputRef} onChange={handleLoadProject} accept=".json" className="hidden" />
      <input type="file" ref={appendInputRef} onChange={handleAppendUpload} accept=".csv, .xlsx, .xls" className="hidden" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-2 rounded-lg shadow-md">
                <Table className="h-6 w-6 text-white" />
             </div>
             <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                    Profi Data Studio
                </h1>
                {data && (
                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <FileText className="w-3 h-3 mr-1" />
                        {data.fileName || 'Unbenannt'} 
                        <span className="mx-1">•</span> 
                        {data.rows.length} Datensätze
                    </div>
                )}
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             {!data ? (
                 <Button variant="secondary" onClick={() => projectInputRef.current?.click()} icon={<FolderOpen size={16} />}>
                     Projekt öffnen
                 </Button>
             ) : (
                 <>
                    <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>
                    <Button variant="secondary" onClick={() => appendInputRef.current?.click()} icon={<Plus size={16} />} title="Weitere Excel/CSV Datei anfügen">
                       Daten hinzufügen
                    </Button>
                    <Button variant="primary" onClick={handleSaveProject} icon={<Save size={16} />}>
                       Projekt speichern
                    </Button>
                 </>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm flex items-start animate-fade-in">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
            <div>
                <h3 className="text-sm font-medium text-red-800">Systemmeldung</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {!data ? (
          <div className="max-w-xl mx-auto mt-24 animate-fade-in-up">
             <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Willkommen im Studio</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Visualisieren Sie CSV- und Excel-Dateien, nutzen Sie Makros zur Analyse und speichern Sie Ihre Projekte.
                </p>
                
                <FileUploader onFileUpload={handleInitialUpload} isLoading={loading} />
                
                <div className="mt-6 text-xs text-gray-400">
                    Unterstützt .xlsx, .xls, .csv • Keine Cloud-Übertragung (lokale Verarbeitung)
                </div>
             </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            
            {/* Sidebar Controls */}
            <div className="w-full lg:w-80 flex-shrink-0 h-full overflow-hidden flex flex-col">
               <ControlPanel 
                  data={data} 
                  config={config} 
                  onConfigChange={setConfig} 
                  onReset={handleReset}
               />
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col h-full min-w-0">
               {/* Tabs */}
               <div className="flex justify-between items-center mb-4">
                   <div className="flex space-x-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        <button 
                          onClick={() => setActiveTab('chart')}
                          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'chart' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                          <Play className="w-4 h-4 mr-2" /> Analyse
                        </button>
                        <button 
                          onClick={() => setActiveTab('table')}
                          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'table' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                          <Table className="w-4 h-4 mr-2" /> Datenraster
                        </button>
                   </div>
               </div>

              {activeTab === 'chart' ? (
                 <MainChart data={data} config={config} />
              ) : (
                 <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden flex-1 flex flex-col animate-fade-in">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Datenquelle</h3>
                        <span className="text-xs text-gray-400 font-mono">Zeilen: {data.rows.length} • Spalten: {data.headers.length}</span>
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
                             {data.rows.slice(0, 500).map((row, i) => ( 
                                <tr key={i} className="hover:bg-blue-50 transition-colors group">
                                   <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-400 font-mono border-r border-gray-100 bg-gray-50 group-hover:bg-blue-50">{i + 1}</td>
                                   {data.headers.map(h => (
                                      <td key={`${i}-${h}`} className="px-6 py-2 whitespace-nowrap text-sm text-gray-600 font-mono border-r border-gray-100 last:border-0">
                                         {row[h]}
                                      </td>
                                   ))}
                                </tr>
                             ))}
                          </tbody>
                       </table>
                       {data.rows.length > 500 && (
                           <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 border-t sticky bottom-0">
                               Vorschau: Zeigt die ersten 500 von {data.rows.length} Einträgen.
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
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
            animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;