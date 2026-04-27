import { useState } from 'react';
import { useLogs } from '../hooks/useLogs';
import { Activity, AlertCircle, Info, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, dark, color }) => (
  <div className={`rounded-xl p-5 border ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
    <div className="flex items-center justify-between mb-3">
      <p className={`text-sm font-medium ${dark ? 'text-white/60' : 'text-gray-500'}`}>{title}</p>
      <div className={`w-9 h-9 rounded-lg ${color}/10 flex items-center justify-center`}>
        <Icon size={18} className={color} />
      </div>
    </div>
    <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>{value}</p>
  </div>
);

const levelStyles = {
  info: { style: 'bg-blue-500/10 text-blue-400', icon: Info },
  warn: { style: 'bg-amber-500/10 text-amber-400', icon: AlertTriangle },
  warning: { style: 'bg-amber-500/10 text-amber-400', icon: AlertTriangle },
  error: { style: 'bg-red-500/10 text-red-400', icon: AlertCircle },
  success: { style: 'bg-emerald-500/10 text-emerald-400', icon: CheckCircle },
};

const Logs = () => {
  const dark = document.documentElement.classList.contains('dark');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('ALL');
  const { logs, loading, error } = useLogs(page);

  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.level?.toLowerCase() === filter.toLowerCase());

  const info = logs.filter(l => l.level?.toLowerCase() === 'info').length;
  const warns = logs.filter(l => ['warn', 'warning'].includes(l.level?.toLowerCase())).length;
  const errors = logs.filter(l => l.level?.toLowerCase() === 'error').length;
  const success = logs.filter(l => l.level?.toLowerCase() === 'success').length;

  const stats = [
    { title: 'Total Logs', value: logs.length, icon: Activity, color: 'text-[#6769ef]' },
    { title: 'Info', value: info, icon: Info, color: 'text-blue-400' },
    { title: 'Warnings', value: warns, icon: AlertTriangle, color: 'text-amber-400' },
    { title: 'Errors', value: errors, icon: AlertCircle, color: 'text-red-400' },
  ];

  return (
    <div className="p-6 space-y-5">

      <div>
        <h1 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>System Logs</h1>
        <p className={`text-sm mt-0.5 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Monitor system activity and events</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.title} {...s} dark={dark} />)}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['ALL', 'INFO', 'WARNING', 'ERROR', 'SUCCESS'].map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === tab ? 'bg-[#6769ef] text-white' : dark ? 'bg-gray-800 text-white/50 hover:text-white border border-gray-700' : 'bg-gray-100 text-gray-500 hover:text-gray-800'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className={`rounded-xl border overflow-hidden ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#6769ef] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm p-6">{error}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${dark ? 'border-gray-700 text-white/50' : 'border-gray-200 text-gray-500'}`}>
                <th className="text-left px-5 py-3 font-medium">Level</th>
                <th className="text-left px-5 py-3 font-medium">Message</th>
                <th className="text-left px-5 py-3 font-medium">Source</th>
                <th className="text-left px-5 py-3 font-medium">User</th>
                <th className="text-left px-5 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className={`text-center py-10 ${dark ? 'text-white/30' : 'text-gray-400'}`}>No logs found</td></tr>
              ) : filtered.map((log, i) => {
                const level = log.level?.toLowerCase() ?? 'info';
                const { style, icon: LevelIcon } = levelStyles[level] ?? levelStyles.info;
                return (
                  <tr key={log.id ?? i} className={`border-b last:border-0 ${dark ? 'border-gray-700/50 hover:bg-gray-700/40' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${style}`}>
                        <LevelIcon size={11} />
                        {log.level ?? 'info'}
                      </span>
                    </td>
                    <td className={`px-5 py-3 max-w-xs truncate ${dark ? 'text-white/80' : 'text-gray-700'}`}>{log.message}</td>
                    <td className={`px-5 py-3 font-mono text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>{log.source ?? '—'}</td>
                    <td className={`px-5 py-3 ${dark ? 'text-white/60' : 'text-gray-500'}`}>{log.user ?? '—'}</td>
                    <td className={`px-5 py-3 text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>Page {page}</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className={`p-2 rounded-lg border transition-colors disabled:opacity-40 ${dark ? 'border-gray-700 hover:bg-gray-700 text-white' : 'border-gray-200 hover:bg-gray-50'}`}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setPage(p => p + 1)} disabled={logs.length < 50}
            className={`p-2 rounded-lg border transition-colors disabled:opacity-40 ${dark ? 'border-gray-700 hover:bg-gray-700 text-white' : 'border-gray-200 hover:bg-gray-50'}`}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default Logs;