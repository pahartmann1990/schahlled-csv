import React from 'react';
import { ParsedData, ChartConfigState } from '../types';
import { Settings, BarChart2, Calendar, Filter } from 'lucide-react';
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
            <Settings className="w-5 h-5 mr-2 text-green-700" />
            Kontrollzentrum
        </h2>
        <button onClick={onReset} className="text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded transition-colors">
            Reset
        </button>
      </div>

      <div className="space-y-8 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        
        {/* Date Filter */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
           <label className="flex items-center text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              <Filter className="w-4 h-4 mr-2" />
              Zeitraum Filter
           </label>
           <div className="space-y-3">
              <div>
                  <span className="text-xs text-gray-500 mb-1 block">Von Datum</span>
                  <input 
                    type="date" 
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                    value={config.filterStart}
                    onChange={(e) => onConfigChange({...config, filterStart: e.target.value})}
                  />
              </div>
              <div>
                  <span className="text-xs text-gray-500 mb-1 block">Bis Datum</span>
                  <input 
                    type="date" 
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                    value={config.filterEnd}
                    onChange={(e) => onConfigChange({...config, filterEnd: e.target.value})}
                  />
              </div>
              <button 
                onClick={() => onConfigChange({...config, filterStart: '', filterEnd: ''})}
                className="w-full mt-2 text-xs text-blue-600 hover:text-blue-800 underline text-right"
              >
                Filter löschen
              </button>
           </div>
        </div>

        {/* X-Axis Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Zeitachse (X)
          </label>
          <select
            value={config.xAxisKey}
            onChange={handleXAxisChange}
            className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 rounded-md border bg-white"
          >
            {data.headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        {/* Display Options */}
        <div>
           <label className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              <Settings className="w-4 h-4 mr-2" />
              Ansicht
           </label>
           <div className="flex items-center px-1">
              <input
                id="grid-toggle"
                type="checkbox"
                checked={config.showGrid}
                onChange={(e) => onConfigChange({...config, showGrid: e.target.checked})}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="grid-toggle" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Raster anzeigen
              </label>
           </div>
        </div>

        {/* Y-Axis Toggles */}
        <div>
          <label className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
             <BarChart2 className="w-4 h-4 mr-2" />
             Datenreihen auswählen
          </label>
          <div className="space-y-2">
            {data.headers.map((header, idx) => {
               if (header === config.xAxisKey) return null;

               const isActive = config.activeLines.includes(header);
               const color = getColor(config.activeLines.indexOf(header));

               return (
                <div key={header} className={`flex items-center p-2 rounded-md transition-colors ${isActive ? 'bg-green-50 border border-green-100' : 'hover:bg-gray-50 border border-transparent'}`}>
                  <input
                    id={`toggle-${header}`}
                    type="checkbox"
                    checked={isActive}
                    onChange={() => handleLineToggle(header)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
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