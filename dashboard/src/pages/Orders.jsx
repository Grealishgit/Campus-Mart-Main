import { useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import { ShoppingCart, CheckCircle, XCircle, Clock, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, dark }) => (
  <div className={`rounded-xl p-5 border ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
    <div className="flex items-center justify-between mb-3">
      <p className={`text-sm font-medium ${dark ? 'text-white/60' : 'text-gray-500'}`}>{title}</p>
      <div className="w-9 h-9 rounded-lg bg-[#6769ef]/10 flex items-center justify-center">
        <Icon size={18} className="text-[#6769ef]" />
      </div>
    </div>
    <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>{value}</p>
  </div>
);

const statusStyles = {
  completed: 'bg-emerald-500/10 text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-400',
  cancelled: 'bg-red-500/10 text-red-400',
};

const Orders = () => {
  const { theme } = useOutletContext();
  const dark = theme === 'dark';
  const [page, setPage] = useState(1);
  const { orders, loading, error } = useOrders(page);

  const completed = orders.filter(o => o.status === 'completed').length;
  const pending = orders.filter(o => o.status === 'pending').length;
  const cancelled = orders.filter(o => o.status === 'cancelled').length;
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + Number(o.amount), 0);

  const stats = [
    { title: 'Total Orders', value: orders.length, icon: ShoppingCart },
    { title: 'Completed', value: completed, icon: CheckCircle },
    { title: 'Pending', value: pending, icon: Clock },
    { title: 'Revenue', value: `KES ${totalRevenue.toLocaleString()}`, icon: DollarSign },
  ];

  return (
    <div className="p-6 space-y-5">

      <div>
        <h1 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>Orders</h1>
        <p className={`text-sm mt-0.5 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Track and manage all orders</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => <StatCard key={s.title} {...s} dark={dark} />)}
      </div>

      <div className={`rounded-xl border overflow-hidden ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#6769ef] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
            <p className="p-6 text-sm text-red-400">{error}</p>
        ) : (
              <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${dark ? 'border-gray-700 text-white/50' : 'border-gray-200 text-gray-500'}`}>
                    <th className="px-5 py-3 font-medium text-left">Order ID</th>
                    <th className="px-5 py-3 font-medium text-left">Buyer</th>
                    <th className="px-5 py-3 font-medium text-left">Seller</th>
                    <th className="px-5 py-3 font-medium text-left">Item</th>
                    <th className="px-5 py-3 font-medium text-left">Amount</th>
                    <th className="px-5 py-3 font-medium text-left">Status</th>
                    <th className="px-5 py-3 font-medium text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} className={`text-center py-10 ${dark ? 'text-white/30' : 'text-gray-400'}`}>No orders found</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className={`border-b last:border-0 ${dark ? 'border-gray-700/50 hover:bg-gray-700/40' : 'border-gray-100 hover:bg-gray-50'}`}>
                  <td className={`px-5 py-3 font-mono text-xs ${dark ? 'text-white/50' : 'text-gray-400'}`}>#{order.id}</td>
                  <td className={`px-5 py-3 ${dark ? 'text-white/60' : 'text-gray-500'}`}>
                    <p>{order.buyer_name ?? '—'}</p>
                    <p className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>{order.buyer_email ?? ''}</p>
                  </td>
                  <td className={`px-5 py-3 ${dark ? 'text-white/60' : 'text-gray-500'}`}>
                    <p>{order.seller_name ?? '—'}</p>
                    <p className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>{order.seller_email ?? ''}</p>
                  </td>
                  <td className={`px-5 py-3 font-medium ${dark ? 'text-white' : 'text-gray-800'}`}>{order.item_title ?? '—'}</td>
                  <td className={`px-5 py-3 ${dark ? 'text-white/60' : 'text-gray-500'}`}>KES {Number(order.amount).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[order.status] ?? 'bg-gray-500/10 text-gray-400'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className={`px-5 py-3 ${dark ? 'text-white/50' : 'text-gray-400'}`}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
              </div>
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
          <button onClick={() => setPage(p => p + 1)} disabled={orders.length < 20}
            className={`p-2 rounded-lg border transition-colors disabled:opacity-40 ${dark ? 'border-gray-700 hover:bg-gray-700 text-white' : 'border-gray-200 hover:bg-gray-50'}`}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default Orders;