import { useListings } from '../hooks/useListings';
import { Tag, ShieldCheck, CheckCircle, TrendingUp, XCircle } from 'lucide-react';

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

const Sales = () => {
  const dark = document.documentElement.classList.contains('dark');
  const { listings, loading, error, verifyListing } = useListings();

  const sales = listings.filter(l => l.type === 'SALE');

  const totalValue = sales.reduce((sum, l) => sum + Number(l.price), 0);
  const verified = sales.filter(l => l.is_verified).length;
  const unverified = sales.filter(l => !l.is_verified).length;
  const available = sales.filter(l => l.is_available).length;

  const stats = [
    { title: 'Total Sale Listings', value: sales.length, icon: Tag },
    { title: 'Total Value', value: `KES ${totalValue.toLocaleString()}`, icon: TrendingUp },
    { title: 'Verified', value: verified, icon: CheckCircle },
    { title: 'Unverified', value: unverified, icon: XCircle },
  ];

  return (
    <div className="p-6 space-y-5">

      <div>
        <h1 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>Sales</h1>
        <p className={`text-sm mt-0.5 ${dark ? 'text-white/50' : 'text-gray-500'}`}>All listings available for sale</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.title} {...s} dark={dark} />)}
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
                <th className="text-left px-5 py-3 font-medium">Title</th>
                <th className="text-left px-5 py-3 font-medium">Category</th>
                <th className="text-left px-5 py-3 font-medium">Price</th>
                <th className="text-left px-5 py-3 font-medium">Seller</th>
                <th className="text-left px-5 py-3 font-medium">Available</th>
                <th className="text-left px-5 py-3 font-medium">Verified</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={7} className={`text-center py-10 ${dark ? 'text-white/30' : 'text-gray-400'}`}>No sale listings found</td></tr>
              ) : sales.map((listing) => (
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
                      <button onClick={() => verifyListing(listing.id, 'SALE')} title="Verify"
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

export default Sales;