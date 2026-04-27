import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ orders, dark }) => {
  // Group completed orders by month
  const monthMap = {};
  orders
    .filter(o => o.status === 'completed')
    .forEach(o => {
      const month = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthMap[month] = (monthMap[month] ?? 0) + Number(o.amount);
    });

  const data = Object.entries(monthMap)
    .map(([month, revenue]) => ({ month, revenue }))
    .slice(-8);

  return (
    <div className={`rounded-xl border p-5 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
      <h3 className={`text-sm font-semibold mb-4 ${dark ? 'text-white' : 'text-gray-800'}`}>Revenue Over Time</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6769ef" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6769ef" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f0f0f0'} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: dark ? '#ffffff60' : '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: dark ? '#ffffff60' : '#9ca3af' }} axisLine={false} tickLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}
            formatter={v => [`KES ${Number(v).toLocaleString()}`, 'Revenue']}
          />
          <Area type="monotone" dataKey="revenue" stroke="#6769ef" strokeWidth={2} fill="url(#revenueGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;