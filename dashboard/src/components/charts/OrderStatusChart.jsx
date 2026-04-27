import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = { completed: '#10b981', pending: '#f59e0b', cancelled: '#ef4444' };

const OrderStatusChart = ({ orders, dark }) => {
  const statuses = ['completed', 'pending', 'cancelled'];
  const data = statuses.map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: orders.filter(o => o.status === s).length,
  })).filter(d => d.value > 0);

  console.log("Orders", orders)

  return (
    <div className={`rounded-xl border p-5 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
      <h3 className={`text-sm font-semibold mb-4 ${dark ? 'text-white' : 'text-gray-800'}`}>Order Status Breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
            {data.map((entry, i) => <Cell key={i} fill={COLORS[entry.name.toLowerCase()] ?? '#6769ef'} />)}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: dark ? '#ffffff99' : '#6b7280' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrderStatusChart;