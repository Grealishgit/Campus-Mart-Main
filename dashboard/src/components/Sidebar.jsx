import { NavLink } from 'react-router-dom'
import { useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

import {
  LayoutDashboard, LogOut,
  Settings, Users,
  Activity, ArrowLeftRight, User,
  ArchiveRestore, Box,
  BadgeDollarSign
} from 'lucide-react'


const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/listings', icon: Box, label: 'Listings' },
  { to: '/sales', icon: BadgeDollarSign, label: 'Sales' },
  { to: '/lease', icon: ArchiveRestore, label: 'Leases' },
  { to: '/users', icon: Users, label: 'All Users' },
  { to: '/orders', icon: ArrowLeftRight, label: 'Orders' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const BOTTOM_NAV = [
  { to: '/logs', icon: Activity, label: 'System Logs' },
  { to: '/profile', icon: User, label: 'Profile' },
]

const Sidebar = ({ sidebarOpen, setSidebarOpen, sidebarWidth, setSidebarWidth }) => {
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(256);
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 420;

  const onResizeMouseDown = (e) => {
    if (!sidebarOpen) return;
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  const { logout } = useAuth();

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const delta = e.clientX - startXRef.current;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
      setSidebarWidth(next);
    };
    const onMouseUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [setSidebarWidth]);

  return (
    <div
      className='flex flex-col min-h-screen shrink-0 transition-all duration-200'
      style={{ width: sidebarOpen ? sidebarWidth : 0, overflow: 'hidden' }}
    >
      <div className='relative bg-gray-800 border-r border-[#933942]/40 w-full min-h-screen flex flex-col'>

        {/* Resize handle */}
        <div
          onMouseDown={onResizeMouseDown}
          className='absolute top-0 right-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-[#933942]/60 z-10'
        />

        {/* Logo */}
        <div className='flex items-center gap-2 p-2 border-b border-[#933942]/30'>

          <div className='overflow-hidden'>
            <h2 className='font-bold text-[#933942] text-lg truncate'>
              CampusMart
            </h2>
            <p className='text-white/70 text-xs -mt-0.5 truncate'>Admin Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className='flex flex-col gap-1 mt-4 px-2 flex-1'>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                  ? 'bg-[#933942] text-white'
                  : 'text-white/70 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} className='shrink-0' />
              <span className='text-sm font-medium truncate'>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Nav */}
        <nav className='flex flex-col gap-1 mb-2 px-2'>
          {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors 
              ${isActive ? 'bg-[#933942] text-white'
                  : 'text-white/70 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} className='shrink-0' />
              <span className='text-sm font-medium truncate'>{label}</span>
            </NavLink>
          ))}
        </nav>


        {/* Admin info + Logout */}
        <div className='p-2 border-t border-gray-700 mt-auto'>
          <div className='flex items-center gap-3 px-3 py-2'>
            <div className='w-8 h-8 hover:border border-gray-300 rounded-full bg-[#933942] flex items-center justify-center shrink-0'>
              <NavLink to={'/settings'} title='settings'>
                <Settings size={20} className='text-white' />
              </NavLink>

            </div>
            <div className='flex-1 overflow-hidden'>
              <p className='text-white text-sm font-medium truncate'>Super Admin</p>
              <p className='text-white/40 text-xs truncate'>Admin</p>
            </div>
            <button onClick={logout} className='text-white/50 hover:text-red-400 transition-colors cursor-pointer' title='Logout'>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;