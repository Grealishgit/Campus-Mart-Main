import { useStats } from '../hooks/useStats';
import { useListings } from '../hooks/useListings';
import { useOrders } from '../hooks/useOrders';
import { useUsers } from '../hooks/useUsers';
import { Users, Box, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import RevenueChart from '../components/charts/RevenueChart';
import UserGrowthChart from '../components/charts/UserGrowthChart';
import ListingTypeChart from '../components/charts/ListingTypeChart';
import ListingVerifiedChart from '../components/charts/ListingVerifiedChart';
import OrderStatusChart from '../components/charts/OrderStatusChart';
import { useOutletContext } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, trend, dark }) => (
  <div className={`rounded-xl p-5 border ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
    <div className="flex items-center justify-between mb-3">
      <p className={`text-sm font-medium ${dark ? 'text-white/60' : 'text-gray-500'}`}>{title}</p>
      <div className="w-9 h-9 rounded-lg bg-[#6769ef]/10 flex items-center justify-center">
        <Icon size={18} className="text-[#6769ef]" />
      </div>
    </div>
    <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>{value}</p>
    {trend && (
      <p className="flex items-center gap-1 mt-1 text-xs text-emerald-400">
        <TrendingUp size={12} /> {trend}
      </p>
    )}
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-2 border-[#6769ef] border-t-transparent rounded-full animate-spin" />
  </div>
);

const Dashboard = () => {
  const { stats, loading: statsLoading } = useStats();
  const { listings, loading: listingsLoading } = useListings();
  const { orders, loading: ordersLoading } = useOrders();
  const { users, loading: usersLoading } = useUsers();
  const { theme } = useOutletContext();
  const dark = theme === 'dark';

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
        <h1 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>Dashboard</h1>
        <p className={`text-sm mt-0.5 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Welcome back, here's what's happening.</p>
      </div>

      {/* Stat Cards */}
      {statsLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(c => <StatCard key={c.title} {...c} dark={dark} />)}
        </div>
      )}

      {/* Row 1 — Revenue + User Growth */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ordersLoading ? <Spinner /> : <RevenueChart orders={orders} dark={dark} />}
        {usersLoading ? <Spinner /> : <UserGrowthChart users={users} dark={dark} />}
      </div>

      {/* Row 2 — Listing Type + Verified + Order Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listingsLoading ? <Spinner /> : <ListingTypeChart listings={listings} dark={dark} />}
        {listingsLoading ? <Spinner /> : <ListingVerifiedChart listings={listings} dark={dark} />}
        {ordersLoading ? <Spinner /> : <OrderStatusChart orders={orders} dark={dark} />}
      </div>

    </div>
  );
};

export default Dashboard;