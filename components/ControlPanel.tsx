import React from 'react';
import { ParsedData, ChartConfigState } from '../types';
import { Settings, BarChart2, Activity, Sliders, Eye } from 'lucide-react';
import { getColor } from '../utils/colors';

interface ControlPanelProps {
  data: ParsedData;
  config: ChartConfigState;
  onConfigChange: (newConfig: ChartConfigState) => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  data, 
  config, 
  onConfigChange,
  onReset
}) => {
  
  const handleXAxisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onConfigChange({ ...config, xAxisKey: e.target.value });
  };

  const handleLineToggle = (header: string) => {
    const isSelected = config.activeLines.includes(header);
    let newLines;
    
    if (isSelected) {
      newLines = config.activeLines.filter(l => l !== header);
    } else {
      newLines = [...config.activeLines, header];
    }
    
    onConfigChange({ ...config, activeLines: newLines });
  };

  return (
    <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6 h-full flex flex-col text-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-600" />
            Konfiguration
        </h2>
        <button onClick={onReset} className="text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded transition-colors">
            Alles zurücksetzen
        </button>
      </div>

      <div className="space-y-8 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {/* X-Axis Selector */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Basis (X-Achse)
          </label>
          <select
            value={config.xAxisKey}
            onChange={handleXAxisChange}
            className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border bg-white"
          >
            {data.headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        {/* Macros / Analysis Tools */}
        <div>
           <label className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              <Activity className="w-4 h-4 mr-2" />
              Analyse-Makros
           </label>
           
           <div className="space-y-4 px-1">
             <div>
                <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Datenglättung (MA)</span>
                    <span className="text-gray-500 font-mono">{config.smoothing === 0 ? 'Aus' : `Ø ${config.smoothing}`}</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    step="1"
                    value={config.smoothing}
                    onChange={(e) => onConfigChange({...config, smoothing: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-gray-400 mt-1">Berechnet den gleitenden Durchschnitt zur Rauschunterdrückung.</p>
             </div>
             
             <div>
                <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Linienstärke</span>
                    <span className="text-gray-500 font-mono">{config.strokeWidth}px</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="0.5"
                    value={config.strokeWidth}
                    onChange={(e) => onConfigChange({...config, strokeWidth: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
             </div>

              <div className="flex items-center">
                  <input
                    id="grid-toggle"
                    type="checkbox"
                    checked={config.showGrid}
                    onChange={(e) => onConfigChange({...config, showGrid: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="grid-toggle" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Raster anzeigen
                  </label>
              </div>
           </div>
        </div>

        {/* Y-Axis Toggles */}
        <div>
          <label className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
             <BarChart2 className="w-4 h-4 mr-2" />
             Datenreihen
          </label>
          <div className="space-y-2">
            {data.headers.map((header, idx) => {
               if (header === config.xAxisKey) return null;

               const isActive = config.activeLines.includes(header);
               const color = getColor(config.activeLines.indexOf(header));

               return (
                <div key={header} className={`flex items-center p-2 rounded-md transition-colors ${isActive ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50 border border-transparent'}`}>
                  <input
                    id={`toggle-${header}`}
                    type="checkbox"
                    checked={isActive}
                    onChange={() => handleLineToggle(header)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`toggle-${header}`} className="ml-3 block text-sm font-medium text-gray-700 flex-1 truncate cursor-pointer select-none">
                    {header}
                  </label>
                  {isActive && (
                      <div 
                        className="w-3 h-3 rounded-full ml-2 shadow-sm" 
                        style={{ backgroundColor: color }}
                      />
                  )}
                </div>
               );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};