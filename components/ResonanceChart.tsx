import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ResonanceDataPoint {
  time: string;
  intensity: number;
  coherence: number;
}

interface ResonanceChartProps {
  data: ResonanceDataPoint[];
}

const ResonanceChart: React.FC<ResonanceChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis 
            dataKey="time" 
            stroke="#64748b" 
            tick={{fontSize: 10}} 
            interval="preserveStartEnd"
        />
        <YAxis stroke="#64748b" tick={{fontSize: 10}} domain={[0, 100]} />
        <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
            itemStyle={{ color: '#22d3ee' }}
        />
        <Area 
            type="monotone" 
            dataKey="intensity" 
            stackId="1" 
            stroke="#06b6d4" 
            fill="#06b6d4" 
            fillOpacity={0.2}
            isAnimationActive={false}
        />
        <Area 
            type="monotone" 
            dataKey="coherence" 
            stackId="2" 
            stroke="#a855f7" 
            fill="#a855f7" 
            fillOpacity={0.2} 
            isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ResonanceChart;