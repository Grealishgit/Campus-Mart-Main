import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6769ef', '#f59e0b'];

const ListingTypeChart = ({ listings, dark }) => {
  const data = [
    { name: 'Sale', value: listings.filter(l => l.type === 'SALE').length },
    { name: 'Lease', value: listings.filter(l => l.type === 'LEASE').length },
  ];

  return (
    <div className={`rounded-xl border p-5 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
      <h3 className={`text-sm font-semibold mb-4 ${dark ? 'text-white' : 'text-gray-800'}`}>Listings by Type</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: dark ? '#fff' : '#111' }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: dark ? '#ffffff99' : '#6b7280' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ListingTypeChart;