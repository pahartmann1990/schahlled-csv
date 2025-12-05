import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush
} from 'recharts';
import { ParsedData, ChartConfigState, DataPoint } from '../types';
import { getColor } from '../utils/colors';

interface MainChartProps {
  data: DataPoint[]; // Received already filtered rows
  config: ChartConfigState;
}

export const MainChart: React.FC<MainChartProps> = ({ data, config }) => {
  
  if (config.activeLines.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl shadow-sm p-12">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
           <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Keine Daten ausgewählt</h3>
        <p className="text-gray-500 mt-1 max-w-sm text-center">Wählen Sie Parameter in der Seitenleiste aus.</p>
      </div>
    );
  }

  return (
    <div id="main-chart-container" className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-[600px] w-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800">Datenanalyse Verlauf</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
             <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                {data.length} Datensätze (Gefiltert)
             </span>
          </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 10,
              bottom: 10,
            }}
          >
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />}
            <XAxis 
              dataKey={config.xAxisKey} 
              stroke="#9ca3af"
              tick={{fontSize: 11, fill: '#6b7280'}}
              tickMargin={10}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{fontSize: 11, fill: '#6b7280'}}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                fontSize: '13px',
                padding: '12px'
              }}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            />
            <Legend 
                wrapperStyle={{ paddingTop: '20px' }} 
                iconType="circle"
            />
            <Brush 
                dataKey={config.xAxisKey} 
                height={30} 
                stroke="#cbd5e1"
                fill="#f8fafc"
                tickFormatter={() => ''}
            />
            {config.activeLines.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={getColor(index)}
                activeDot={{ r: 5, strokeWidth: 0 }}
                strokeWidth={2}
                dot={false}
                animationDuration={500}
                isAnimationActive={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};