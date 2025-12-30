

import React from 'react';
import { LogEntry, Task, Theme } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { Translation } from '../translations';

interface MirrorViewProps {
  logs: LogEntry[];
  tasks: Task[];
  onBack: () => void;
  theme: Theme;
  t: Translation;
}

export const MirrorView: React.FC<MirrorViewProps> = ({ logs, tasks, onBack, theme, t }) => {
  const isDark = theme === 'dark';

  // Process Data for Chart
  // We want to show last 7 days: Crystallized (Success) vs Entropy (Fail)
  const processData = () => {
    const days = 7;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];

      // Filter logs for this day
      const dayLogs = logs.filter(l => {
        const logDate = new Date(l.timestamp).toISOString().split('T')[0];
        return logDate === dateKey;
      });

      const crystallized = dayLogs.filter(l => l.type === 'crystallization').length;
      const entropy = dayLogs.filter(l => l.type === 'entropy').length;

      data.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        crystallized,
        entropy: -entropy, // Negative for "Iceberg" effect
      });
    }
    return data;
  };

  const chartData = processData();

  // Efficiency Calculation
  const totalCrystals = logs.filter(l => l.type === 'crystallization').length;
  const totalEntropy = logs.filter(l => l.type === 'entropy').length;
  const efficiency = totalCrystals + totalEntropy > 0
    ? Math.round((totalCrystals / (totalCrystals + totalEntropy)) * 100)
    : 100;

  return (
    <div className={`flex flex-col h-full p-4 overflow-y-auto transition-colors duration-500 ${isDark ? 'bg-zinc-950' : 'bg-stone-50'}`}>
      <header className="flex items-center justify-between mb-4 shrink-0">
        <button onClick={onBack} className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-stone-400 hover:text-stone-900'}`}>
          <ArrowLeft />
        </button>
        <h1 className={`text-xl font-mono ${isDark ? 'text-zinc-300' : 'text-stone-700'}`}>{t.mirror.chronicle}</h1>
      </header>

      {/* Hero Metric */}
      <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
        <div className={`p-4 border rounded ${isDark ? 'border-zinc-800' : 'border-stone-200 bg-white'}`}>
          <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">{t.mirror.efficiency}</div>
          <div className={`text-3xl font-mono ${isDark ? 'text-white' : 'text-stone-900'}`}>{efficiency}%</div>
        </div>
        <div className={`p-4 border rounded ${isDark ? 'border-zinc-800' : 'border-stone-200 bg-white'}`}>
          <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">{t.mirror.totalCrystals}</div>
          <div className="text-3xl font-mono text-emerald-500">{totalCrystals}</div>
        </div>
      </div>

      {/* Iceberg Chart */}
      <div className="h-48 w-full mb-4 shrink-0">
        <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-2">{t.mirror.energyAudit}</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} stackOffset="sign" margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <ReferenceLine y={0} stroke={isDark ? "#333" : "#e5e5e5"} />
            <XAxis
              dataKey="date"
              stroke={isDark ? "#52525b" : "#a8a29e"}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: isDark ? '#71717a' : '#78716c' }}
              dy={10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#18181b' : '#ffffff',
                borderColor: isDark ? '#27272a' : '#e5e5e5',
                color: isDark ? '#f4f4f5' : '#18181b',
                borderRadius: '0.375rem',
                padding: '0.5rem 0.75rem',
              }}
              itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
            />
            <Bar dataKey="crystallized" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={40} />
            <Bar dataKey="entropy" stackId="a" fill="#be123c" radius={[0, 0, 2, 2]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Timeline */}
      <div className="space-y-3">
        <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-2">{t.mirror.recentEvents}</h3>
        {logs.slice().reverse().slice(0, 20).map(log => (
          <div key={log.id} className="flex gap-3 group">
            <div className="flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full ${log.type === 'crystallization' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' :
                log.type === 'entropy' ? 'bg-rose-600' :
                  log.type === 'start' ? (isDark ? 'bg-white' : 'bg-stone-400') :
                    (isDark ? 'bg-zinc-700' : 'bg-stone-300')
                }`}></div>
              <div className={`w-px h-full group-last:bg-transparent my-1 ${isDark ? 'bg-zinc-900' : 'bg-stone-200'}`}></div>
            </div>
            <div className="pb-3">
              <div className={`text-sm font-mono mb-0.5 ${isDark ? 'text-zinc-300' : 'text-stone-700'}`}>
                {log.type === 'crystallization' && t.mirror.crystallized}
                {log.type === 'entropy' && t.mirror.entropyIncrease}
                {log.type === 'start' && t.mirror.committed}
                {log.type === 'creation' && t.mirror.created}
              </div>
              <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-stone-500'}`}>{log.taskTitle}</div>
              {log.entropyReason && (
                <div className="text-rose-600 text-xs mt-0.5 px-2 py-0.5 border border-rose-900/30 inline-block rounded">
                  {t.reasons[log.entropyReason]}
                </div>
              )}
              <div className={`text-xs mt-0.5 ${isDark ? 'text-zinc-700' : 'text-stone-400'}`}>
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};