import { useState } from 'react';
import { useListings } from '../hooks/useListings';
import { Box, ShieldCheck, CheckCircle, XCircle, Tag, ArchiveRestore } from 'lucide-react';
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

const Listings = () => {
  const { theme } = useOutletContext();
  const dark = theme === 'dark';
  const [filter, setFilter] = useState('ALL');
  const { listings, loading, error, verifyListing } = useListings();

  const filtered = filter === 'ALL' ? listings : listings.filter(l => l.type === filter);

  const stats = [
    { title: 'Total Listings', value: listings.length, icon: Box },
    { title: 'Sale Listings', value: listings.filter(l => l.type === 'SALE').length, icon: Tag },
    { title: 'Lease Listings', value: listings.filter(l => l.type === 'LEASE').length, icon: ArchiveRestore },
    { title: 'Unverified', value: listings.filter(l => !l.is_verified).length, icon: XCircle },
  ];

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>Listings</h1>
        <p className={`text-sm mt-0.5 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Manage all property listings</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => <StatCard key={s.title} {...s} dark={dark} />)}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['ALL', 'SALE', 'LEASE'].map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 cursor-pointer rounded-lg text-sm font-medium transition-colors ${filter === tab ? 'bg-[#6769ef] text-white' : dark ? 'bg-gray-800 text-white/50 hover:text-white border border-gray-700' : 'bg-gray-100 text-gray-500 hover:text-gray-800'}`}>
            {tab}
          </button>
        ))}
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
                    <th className="px-5 py-3 font-medium text-left">Title</th>
                    <th className="px-5 py-3 font-medium text-left">Category</th>
                    <th className="px-5 py-3 font-medium text-left">Type</th>
                    <th className="px-5 py-3 font-medium text-left">Price</th>
                    <th className="px-5 py-3 font-medium text-left">Seller</th>
                    <th className="px-5 py-3 font-medium text-left">Available</th>
                    <th className="px-5 py-3 font-medium text-left">Verified</th>
                    <th className="px-5 py-3 font-medium text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className={`text-center py-10 ${dark ? 'text-white/30' : 'text-gray-400'}`}>No listings found</td></tr>
              ) : filtered.map((listing) => (
                <tr key={`${listing.type}-${listing.id}`} className={`border-b last:border-0 ${dark ? 'border-gray-700/50 hover:bg-gray-700/40' : 'border-gray-100 hover:bg-gray-50'}`}>
                  <td className={`px-5 py-3 font-medium ${dark ? 'text-white' : 'text-gray-800'}`}>{listing.title}</td>
                  <td className={`px-5 py-3 ${dark ? 'text-white/60' : 'text-gray-500'}`}>{listing.category}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${listing.type === 'SALE' ? 'bg-[#6769ef]/15 text-[#6769ef]' : 'bg-amber-500/10 text-amber-400'}`}>
                      {listing.type}
                    </span>
                  </td>
                  <td className={`px-5 py-3 ${dark ? 'text-white/60' : 'text-gray-500'}`}>
                    KES {Number(listing.price).toLocaleString()}
                  </td>
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
                    {!listing.is_verified && (
                      <button onClick={() => verifyListing(listing.id, listing.type)} title="Verify listing"
                        className="p-1.5 rounded-lg gap-2 cursor-pointer flex items-center bg-gray-500/10 hover:bg-emerald-500/20 text-gray-200 hover:text-emerald-500 transition-colors">
                        Verify
                        <ShieldCheck size={15} />
                      </button>
                    )}
                    {listing.is_verified && <CheckCircle size={15} className="text-emerald-400 ml-1.5" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
              </div>
        )}
      </div>
    </div>
  );
};

export default Listings;