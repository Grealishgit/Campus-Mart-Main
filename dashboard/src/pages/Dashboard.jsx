import { useStats } from '../hooks/useStats';
import { Users, Box, ShoppingCart, DollarSign, TrendingUp, Activity } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, theme }) => (
  <div className={`rounded-xl p-5 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
    <div className="flex items-center justify-between mb-3">
      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>{title}</p>
      <div className="w-9 h-9 rounded-lg bg-[#6769ef]/10 flex items-center justify-center">
        <Icon size={18} className="text-[#6769ef]" />
      </div>
    </div>
    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{value}</p>
    {trend && (
      <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
        <TrendingUp size={12} /> {trend}
      </p>
    )}
  </div>
);

const Dashboard = () => {
  const { stats, loading, error } = useStats();
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#6769ef] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="m-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
      {error}
    </div>
  );

  const cards = [
    { title: 'Total Users', value: stats?.totalUsers?.toLocaleString() ?? '0', icon: Users },
    { title: 'Total Listings', value: stats?.totalListings?.toLocaleString() ?? '0', icon: Box },
    { title: 'Total Orders', value: stats?.totalOrders?.toLocaleString() ?? '0', icon: ShoppingCart },
    { title: 'Total Revenue', value: `KES ${stats?.totalRevenue?.toLocaleString() ?? '0'}`, icon: DollarSign },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Dashboard</h1>
        <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>Welcome back, here's what's happening.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} theme={theme} />
        ))}
      </div>

      {/* Recent Activity Placeholder */}
      <div className={`rounded-xl border p-5 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-[#6769ef]" />
          <h2 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Recent Activity</h2>
        </div>
        <p className={`text-sm ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>Activity feed coming soon.</p>
      </div>

    </div>
  );
};

export default Dashboard;