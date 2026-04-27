import { useOutletContext } from 'react-router-dom';
import { useListings } from '../hooks/useListings';
import { ArchiveRestore, ShieldCheck, CheckCircle, TrendingUp, XCircle } from 'lucide-react';

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

const Leases = () => {
  const { theme } = useOutletContext();
  const dark = theme === 'dark';
  const { listings, loading, error, verifyListing } = useListings();

  const leases = listings.filter(l => l.type === 'LEASE');

  const totalValue = leases.reduce((sum, l) => sum + Number(l.price), 0);
  const verified = leases.filter(l => l.is_verified).length;
  const unverified = leases.filter(l => !l.is_verified).length;

  const stats = [
    { title: 'Total Lease Listings', value: leases.length, icon: ArchiveRestore },
    { title: 'Total Value', value: `KES ${totalValue.toLocaleString()}`, icon: TrendingUp },
    { title: 'Verified', value: verified, icon: CheckCircle },
    { title: 'Unverified', value: unverified, icon: XCircle },
  ];

  return (
    <div className="p-6 space-y-5">

      <div>
        <h1 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>Leases</h1>
        <p className={`text-sm mt-0.5 ${dark ? 'text-white/50' : 'text-gray-500'}`}>All listings available for lease</p>
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
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${dark ? 'border-gray-700 text-white/50' : 'border-gray-200 text-gray-500'}`}>
                    <th className="px-5 py-3 font-medium text-left">Title</th>
                    <th className="px-5 py-3 font-medium text-left">Category</th>
                    <th className="px-5 py-3 font-medium text-left">Price / mo</th>
                    <th className="px-5 py-3 font-medium text-left">Seller</th>
                    <th className="px-5 py-3 font-medium text-left">Available</th>
                    <th className="px-5 py-3 font-medium text-left">Verified</th>
                    <th className="px-5 py-3 font-medium text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leases.length === 0 ? (
                <tr><td colSpan={7} className={`text-center py-10 ${dark ? 'text-white/30' : 'text-gray-400'}`}>No lease listings found</td></tr>
              ) : leases.map((listing) => (
                <tr key={listing.id} className={`border-b last:border-0 ${dark ? 'border-gray-700/50 hover:bg-gray-700/40' : 'border-gray-100 hover:bg-gray-50'}`}>
                  <td className={`px-5 py-3 font-medium ${dark ? 'text-white' : 'text-gray-800'}`}>{listing.title}</td>
                  <td className={`px-5 py-3 ${dark ? 'text-white/60' : 'text-gray-500'}`}>{listing.category}</td>
                  <td className={`px-5 py-3 ${dark ? 'text-white/60' : 'text-gray-500'}`}>KES {Number(listing.price).toLocaleString()}</td>
                  <td className={`px-5 py-3 ${dark ? 'text-white/60' : 'text-gray-500'}`}>
                    <p>{listing.seller_name}</p>
                    <p className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>{listing.seller_email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${listing.is_available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {listing.is_available ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${listing.is_verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {listing.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {!listing.is_verified ? (
                      <button onClick={() => verifyListing(listing.id, 'LEASE')} title="Verify"
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors">
                        <ShieldCheck size={15} />
                      </button>
                    ) : <CheckCircle size={15} className="text-emerald-400 ml-1.5" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Leases;