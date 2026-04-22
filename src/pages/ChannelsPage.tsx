import { useDataStore } from '@/store/useDataStore';
import { useMemo } from 'react';

export default function ChannelsPage() {
  const { channels, entries } = useDataStore();

  // Compute channel revenues from all entries
  const channelRevenues = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(entry => {
      entry.items.forEach(item => {
        map[item.channel] = (map[item.channel] || 0) + item.amount;
      });
    });
    return map;
  }, [entries]);

  return (
    <>
      {/* Header */}
      <header className="glass px-6 py-5">
        <h1 className="text-xl font-bold tracking-tight dark:text-white text-slate-900">Loan Channel Partners</h1>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-semibold">Revenue Tracking &amp; Closures</p>
      </header>

      {/* Channel Table */}
      <div className="rounded-xl border border-slate-900/10 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-white/[0.02]">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_auto] px-5 py-3 bg-slate-100/80 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Partner Name</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Total Revenue</span>
        </div>

        {/* Table Rows */}
        {channels.map((channel, idx) => {
          const revenue = channelRevenues[channel.name] || 0;
          return (
            <div
              key={channel.id}
              className={`grid grid-cols-[1fr_auto] px-5 py-3.5 border-b border-slate-100 dark:border-white/5 last:border-b-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] ${
                idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-white/[0.01]'
              }`}
            >
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{channel.name}</span>
              <span className={`text-sm font-mono font-semibold text-right ${
                revenue > 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'
              }`}>
                ₹{revenue.toLocaleString('en-IN')}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
