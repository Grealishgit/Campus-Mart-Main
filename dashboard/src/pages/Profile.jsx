import { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Lock, Save, ShieldCheck } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

const Profile = () => {
  const { theme } = useOutletContext();
  const dark = theme === 'dark';
  const { getUser } = useAuth();
  const user = getUser();
  const { updateProfile, changePassword, loading, error, success } = useProfile();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleProfileSave = () => {
    updateProfile({ name, email });
  };

  const handlePasswordChange = () => {
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    changePassword(currentPassword, newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const card = `rounded-xl border p-6 space-y-5 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`;
  const label = `text-sm font-medium mb-1.5 block ${dark ? 'text-white/60' : 'text-gray-500'}`;
  const input = `w-full text-sm rounded-lg px-4 py-2.5 outline-none border transition-colors ${dark ? 'bg-gray-900 border-gray-700 focus:border-[#6769ef] text-white' : 'bg-gray-50 border-gray-200 focus:border-[#6769ef] text-gray-800'}`;

  return (
    <div className="p-6 space-y-6">

      <div>
        <h1 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>Profile</h1>
        <p className={`text-sm mt-0.5 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Manage your account details</p>
      </div>

      {/* Avatar + Info */}
      <div className={`rounded-xl border p-6 flex items-center gap-5 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="w-16 h-16 rounded-full bg-[#6769ef] flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-white">{user?.name?.[0]?.toUpperCase() ?? 'A'}</span>
        </div>
        <div>
          <p className={`font-semibold text-lg ${dark ? 'text-white' : 'text-gray-800'}`}>{user?.name ?? 'Admin'}</p>
          <p className={`text-sm ${dark ? 'text-white/50' : 'text-gray-500'}`}>{user?.email ?? ''}</p>
          <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#6769ef]/15 text-[#6769ef]">
            <ShieldCheck size={11} /> {user?.role ?? 'admin'}
          </span>
        </div>
      </div>

      {/* Profile Form */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-1">
          <User size={16} className="text-[#6769ef]" />
          <h2 className={`font-semibold text-sm ${dark ? 'text-white' : 'text-gray-800'}`}>Personal Information</h2>
        </div>

        {success && (
          <div className="px-4 py-3 text-sm border rounded-lg bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
            Profile updated successfully.
          </div>
        )}
        {error && (
          <div className="px-4 py-3 text-sm text-red-400 border rounded-lg bg-red-500/10 border-red-500/30">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={label}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className={input} placeholder="Your name" />
          </div>
          <div>
            <label className={label}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={input} placeholder="your@email.com" />
          </div>
        </div>

        <button onClick={handleProfileSave} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#6769ef] hover:bg-[#5557d4] disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
          <Save size={15} />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Password Form */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-1">
          <Lock size={16} className="text-[#6769ef]" />
          <h2 className={`font-semibold text-sm ${dark ? 'text-white' : 'text-gray-800'}`}>Change Password</h2>
        </div>

        {passwordError && (
          <div className="px-4 py-3 text-sm text-red-400 border rounded-lg bg-red-500/10 border-red-500/30">
            {passwordError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label className={label}>Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={input} placeholder="••••••••" />
          </div>
          <div>
            <label className={label}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={input} placeholder="••••••••" />
          </div>
          <div>
            <label className={label}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={input} placeholder="••••••••" />
          </div>
        </div>

        <button onClick={handlePasswordChange} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#6769ef] hover:bg-[#5557d4] disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
          <Lock size={15} />
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>

    </div>
  );
};

export default Profile;