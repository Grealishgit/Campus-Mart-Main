import { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { Search, ShieldCheck, Trash2, ChevronLeft, ChevronRight, Users as UsersIcon, BadgeCheck, ShieldOff, GraduationCap } from 'lucide-react';
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

const Users = () => {
  const { theme } = useOutletContext();
  const dark = theme === 'dark';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { users, loading, error, verifyUser, deleteUser } = useUsers(page, search);

  const verified = users.filter(u => u.is_verified).length;
  const unverified = users.filter(u => !u.is_verified).length;
  const withFaculty = users.filter(u => u.faculty).length;

  const stats = [
    { title: 'Total Users', value: users.length, icon: UsersIcon },
    { title: 'Verified', value: verified, icon: BadgeCheck },
    { title: 'Unverified', value: unverified, icon: ShieldOff },
    { title: 'With Faculty', value: withFaculty, icon: GraduationCap },
  ];

  const user_stats = [
    { title: 'Students', value: users.filter(u => u.role === 'student').length, icon: UsersIcon },
    { title: 'Vendors', value: users.filter(u => u.role === 'vendor').length, icon: UsersIcon },
    { title: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: ShieldCheck },
    { title: 'Registered Today', value: users.filter(u => new Date(u.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length, icon: UsersIcon },
  ]

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    await deleteUser(id);
  };

  return (
    <div className="p-5 space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>Users</h1>
          <p className={`text-sm mt-0.5 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Manage all registered users</p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <Search size={15} className="text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search users..."
              className="w-48 bg-transparent outline-none"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-[#6769ef] hover:bg-[#5557d4] text-white text-sm rounded-lg transition-colors">
            Search
          </button>
        </form>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => <StatCard key={s.title} {...s} dark={dark} />)}
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {user_stats.map(s => <StatCard key={s.title} {...s} dark={dark} />)}
      </div>

      {/* Table */}
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
                      <th className="px-5 py-3 font-medium text-left">Name</th>
                      <th className="px-5 py-3 font-medium text-left">Email</th>
                      <th className="px-5 py-3 font-medium text-left">Role</th>
                      <th className="px-5 py-3 font-medium text-left">Faculty</th>
                      <th className="px-5 py-3 font-medium text-left">Verified</th>
                      <th className="px-5 py-3 font-medium text-left">Joined</th>
                      <th className="px-5 py-3 font-medium text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={7} className={`text-center py-10 ${dark ? 'text-white/30' : 'text-gray-400'}`}>No users found</td></tr>
                    ) : users.map((user) => (
                      <tr key={user.id} className={`border-b last:border-0 ${dark ? 'border-gray-700/50 hover:bg-gray-700/40' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <td className={`px-5 py-3 font-medium ${dark ? 'text-white' : 'text-gray-800'}`}>{user.name}</td>
                        <td className={`px-5 py-3 ${dark ? 'text-white/60' : 'text-gray-500'}`}>{user.email}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                            ? 'bg-[#6769ef]/15 text-[#6769ef]'
                            : user.role === 'vendor'
                              ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                              : dark
                                ? 'bg-gray-700 text-white/60'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className={`px-5 py-3 ${dark ? 'text-white/60' : 'text-gray-500'}`}>{user.faculty ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.is_verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {user.is_verified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className={`px-5 py-3 ${dark ? 'text-white/50' : 'text-gray-400'}`}>
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {!user.is_verified && (
                              <button onClick={() => verifyUser(user.id)} title="Verify user"
                                className="p-1.5 cursor-pointer rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors">
                                <ShieldCheck size={15} />
                              </button>
                            )}
                            <button onClick={() => handleDelete(user.id)} title="Delete user"
                              className="p-1.5 cursor-pointer rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>Page {page}</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className={`p-2 rounded-lg border transition-colors disabled:opacity-40 ${dark ? 'border-gray-700 hover:bg-gray-700 text-white' : 'border-gray-200 hover:bg-gray-50'}`}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setPage((p) => p + 1)} disabled={users.length < 20}
            className={`p-2 rounded-lg border transition-colors disabled:opacity-40 ${dark ? 'border-gray-700 hover:bg-gray-700 text-white' : 'border-gray-200 hover:bg-gray-50'}`}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default Users;