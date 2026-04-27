import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Sun, Moon, Monitor, LogOut, ShieldAlert, Bell, Palette } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

const Settings = () => {
  const dark = document.documentElement.classList.contains('dark');
  const { setTheme, themeMode } = useOutletContext();
  const { logout, getUser } = useAuth();
  const user = getUser();

  const [notifications, setNotifications] = useState(true);

  const card = `rounded-xl border p-6 space-y-4 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`;
  const sectionTitle = `font-semibold text-sm ${dark ? 'text-white' : 'text-gray-800'}`;
  const desc = `text-xs mt-0.5 ${dark ? 'text-white/40' : 'text-gray-400'}`;

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="p-6 space-y-6">

      <div>
        <h1 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>Settings</h1>
        <p className={`text-sm mt-0.5 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Manage your preferences</p>
      </div>

      {/* Appearance */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-[#6769ef]" />
          <h2 className={sectionTitle}>Appearance</h2>
        </div>
        <p className={desc}>Choose your preferred theme</p>
        <div className="flex items-center gap-3 mt-2">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button key={value} onClick={() => setTheme(value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${themeMode === value ? 'bg-[#6769ef] border-[#6769ef] text-white' : dark ? 'border-gray-700 text-white/60 hover:text-white hover:border-gray-500' : 'border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[#6769ef]" />
          <h2 className={sectionTitle}>Notifications</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${dark ? 'text-white/80' : 'text-gray-700'}`}>Enable notifications</p>
            <p className={desc}>Receive alerts for new orders and user activity</p>
          </div>
          <button onClick={() => setNotifications(!notifications)}
            className={`relative w-11 h-6 rounded-full transition-colors ${notifications ? 'bg-[#6769ef]' : dark ? 'bg-gray-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Account */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-[#6769ef]" />
          <h2 className={sectionTitle}>Account</h2>
        </div>
        <div className={`flex items-center justify-between py-3 border-b ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
          <div>
            <p className={`text-sm ${dark ? 'text-white/80' : 'text-gray-700'}`}>Signed in as</p>
            <p className={desc}>{user?.email ?? 'admin'}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#6769ef]/15 text-[#6769ef]">
            {user?.role ?? 'admin'}
          </span>
        </div>
        <div className="pt-2">
          <button onClick={logout}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg transition-colors">
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>

    </div>
  );
};

export default Settings;