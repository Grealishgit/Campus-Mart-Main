import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const UserGrowthChart = ({ users, dark }) => {
  if (!users?.length) return (
    <div className={`rounded-xl border p-5 flex items-center justify-center h-70 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
      <p className={`text-sm ${dark ? 'text-white/30' : 'text-gray-400'}`}>No user data yet</p>
    </div>
  );

  const monthMap = {};
  users.forEach(u => {
    const month = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthMap[month] = (monthMap[month] ?? 0) + 1;
  });

  const data = Object.entries(monthMap)
    .map(([month, count]) => ({ month, count }))
    .slice(-8);

  return (
    <div className={`rounded-xl border p-5 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
      <h3 className={`text-sm font-semibold mb-4 ${dark ? 'text-white' : 'text-gray-800'}`}>User Growth</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f0f0f0'} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: dark ? '#ffffff60' : '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: dark ? '#ffffff60' : '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}
            formatter={v => [v, 'New Users']}
          />
          <Bar dataKey="count" fill="#6769ef" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UserGrowthChart;