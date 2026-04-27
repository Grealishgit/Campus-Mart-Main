import { NavLink } from 'react-router-dom'
import { useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, LogOut, Settings, Users,
  Activity, ArrowLeftRight, User,
  ArchiveRestore, Box, BadgeDollarSign,
  Sun,
  Moon
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/listings',  icon: Box,             label: 'Listings'  },
  { to: '/sales',     icon: BadgeDollarSign,  label: 'Sales'     },
  { to: '/lease',     icon: ArchiveRestore,   label: 'Leases'    },
  { to: '/users',     icon: Users,            label: 'All Users' },
  { to: '/orders',    icon: ArrowLeftRight,   label: 'Orders'    },
  { to: '/settings',  icon: Settings,         label: 'Settings'  },
];

const BOTTOM_NAV = [
  { to: '/logs',    icon: Activity, label: 'System Logs' },
  { to: '/profile', icon: User,     label: 'Profile'     },
];

const Sidebar = ({ theme, sidebarOpen, setTheme, setSidebarOpen, sidebarWidth, setSidebarWidth }) => {
  const { logout, getUser } = useAuth();
  const user = getUser();
  const dark = theme === 'dark';

  const isResizingRef   = useRef(false);
  const startXRef       = useRef(0);
  const startWidthRef   = useRef(256);
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 420;

  const onResizeMouseDown = (e) => {
    if (!sidebarOpen) return;
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current   = true;
    startXRef.current       = e.clientX;
    startWidthRef.current   = sidebarWidth;
    document.body.style.userSelect = 'none';
    document.body.style.cursor     = 'col-resize';
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const delta = e.clientX - startXRef.current;
      const next  = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
      setSidebarWidth(next);
    };
    const onMouseUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current          = false;
      document.body.style.userSelect = '';
      document.body.style.cursor     = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, [setSidebarWidth]);

  const bg        = dark ? 'bg-[#151419]'   : 'bg-white';
  const border    = dark ? 'border-[#6769ef]/20' : 'border-gray-200';
  const textMain  = dark ? 'text-white'      : 'text-gray-800';
  const textMuted = dark ? 'text-white/40'   : 'text-gray-400';
  const hover     = dark ? 'hover:bg-[#6769ef]/10 hover:text-white' : 'hover:bg-[#6769ef]/8 hover:text-gray-900';
  const active    = 'bg-[#6769ef] text-white';
  const inactive  = dark ? 'text-white/60' : 'text-gray-500';

  return (
    <div
      className='flex flex-col min-h-screen transition-all duration-200 shrink-0'
      style={{ width: sidebarOpen ? sidebarWidth : 0, overflow: 'hidden' }}
    >
      <div className={`relative ${bg} border-r ${border} w-full min-h-screen flex flex-col transition-colors duration-200`}>

        {/* Resize handle */}
        <div
          onMouseDown={onResizeMouseDown}
          className='absolute top-0 right-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-[#6769ef]/40 z-10'
        />

        {/* Logo */}
        <div className={`flex items-center gap-2 p-4 border-b ${border}`}>
          <div className='w-8 h-8 rounded-lg bg-[#6769ef] flex items-center justify-center shrink-0'>
            <span className='text-sm font-bold text-white'>C</span>
          </div>
          <div className='overflow-hidden'>
            <h2 className='font-bold text-[#6769ef] text-base truncate'>CampusMart</h2>
            <p className={`text-xs -mt-0.5 truncate ${textMuted}`}>Admin Portal</p>
          </div>
          <div className='ml-auto cursor-pointer text-[#6769ef] p-1 rounded hover:bg-[#6769ef]/10' onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </div>
        </div>

        {/* Main Nav */}
        <nav className='flex flex-col gap-0.5 mt-4 px-2 flex-1'>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive ? active : `${inactive} ${hover}`
                }`
              }
            >
              <Icon size={17} className='shrink-0' />
              <span className='truncate'>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Nav */}
        <nav className='flex flex-col gap-0.5 px-2 mb-2'>
          {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isActive ? active : `${inactive} ${hover}`
                }`
              }
            >
              <Icon size={17} className='shrink-0' />
              <span className='truncate'>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className={`p-3 border-t ${border} mt-auto`}>
          <div className='flex items-center gap-3 px-2 py-2'>
            <div className='w-8 h-8 rounded-full bg-[#6769ef] flex items-center justify-center shrink-0'>
              <span className='text-xs font-bold text-white'>
                {user?.name?.[0]?.toUpperCase() ?? 'A'}
              </span>
            </div>
            <div className='flex-1 overflow-hidden'>
              <p className={`text-sm font-medium truncate ${textMain}`}>{user?.name ?? 'Admin'}</p>
              <p className={`text-xs truncate ${textMuted}`}>{user?.role ?? 'admin'}</p>
            </div>
            <button
              onClick={logout}
              title='Logout'
              className='text-gray-400 transition-colors cursor-pointer hover:text-red-400'
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;