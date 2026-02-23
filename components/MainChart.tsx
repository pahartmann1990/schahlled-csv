import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartConfigState, DataPoint } from '../types';

interface MainChartProps {
  data: DataPoint[];
  config: ChartConfigState;
  isDashboardMode?: boolean;
}

export const MainChart: React.FC<MainChartProps> = ({ data, config, isDashboardMode }) => {
  
  if (config.activeLines.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-400">Keine Daten gewählt</div>;
  }

  const formatXAxis = (tick: string) => {
    // If it's a month-year like "Jan 2025", maybe just return "Jan" for brevity if there are many
    return tick;
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="1 1" vertical={true} stroke="#e5e7eb" />
          <XAxis 
            dataKey={config.xAxisKey} 
            stroke="#9ca3af"
            tick={{fontSize: 10, fill: '#6b7280'}}
            tickMargin={15}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-35}
            textAnchor="end"
          />
          <YAxis 
            stroke="#9ca3af"
            tick={{fontSize: 10, fill: '#6b7280'}}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
            }}
          />
          {config.activeLines.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke="#00a3e0" // Nice energy blue
              strokeWidth={3}
              dot={{ r: 4, fill: '#00a3e0', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
              isAnimationActive={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
