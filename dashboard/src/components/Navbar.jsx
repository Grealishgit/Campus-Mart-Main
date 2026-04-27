import { Bell, LogOut, Headset, Menu, Settings, Box } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Navbar = ({ theme, themeMode, setTheme, sidebarOpen, setSidebarOpen, sidebarWidth = 256 }) => {
    const { logout, getUser } = useAuth();
    const user = getUser();
    const dark = theme === 'dark';

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const interval = setInterval(() => {
            setSystemTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const today = new Date();
    const systemDate = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const bg = dark ? 'bg-[#151419]' : 'bg-white';
    const border = dark ? 'border-[#6769ef]/20' : 'border-gray-200';
    const textMain = dark ? 'text-white' : 'text-gray-800';
    const textMuted = dark ? 'text-white/50' : 'text-gray-400';
    const menuBg = dark ? 'bg-[#1e1c24]' : 'bg-white';
    const menuHover = dark ? 'hover:bg-[#6769ef]/10' : 'hover:bg-gray-50';

    return (
        <div
            className={`fixed top-0 left-0 z-50 border-b ${border} shadow-sm backdrop-blur-sm transition-all duration-200`}
            style={{
                marginLeft: sidebarOpen ? sidebarWidth : 0,
                width: sidebarOpen ? `calc(100% - ${sidebarWidth}px)` : '100%',
            }}
        >
            <div className={`flex flex-row px-4 py-3 ${bg} ${textMain} justify-between items-center w-full transition-colors duration-200`}>
                {/* Left */}
                <div className='flex items-center gap-3'>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`${textMuted} hover:${textMain} transition-colors cursor-pointer`}
                    >
                        <Menu size={20} />
                    </button>

                    <NavLink
                        to='/orders'
                        className='font-medium flex items-center gap-2 bg-[#6769ef] hover:bg-[#5557d4] px-3 py-1.5 rounded-lg text-white text-sm transition-colors'
                    >
                        <Box size={14} />
                        View Orders
                    </NavLink>
                </div>

                {/* Center — date & time */}
                <div className='items-center hidden gap-2 text-sm md:flex'>
                    <p className={`font-medium ${textMuted}`}>{systemDate}</p>
                    <span className={textMuted}>|</span>
                    <p className='font-semibold text-[#6769ef]'>{systemTime}</p>
                </div>

                {/* Right */}
                <div className='relative flex items-center gap-3'>
                    <button
                        className='text-right cursor-pointer'
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <p className={`text-sm font-medium ${textMain}`}>{user?.name ?? 'Admin'}</p>
                        <p className={`text-xs ${textMuted}`}>{user?.role ?? 'System Admin'}</p>
                    </button>

                    <button
                        onMouseEnter={() => setShowProfileMenu(true)}
                        className='w-8 h-8 cursor-pointer rounded-full bg-[#6769ef] flex items-center justify-center hover:opacity-90 transition-opacity'
                    >
                        <span className='text-sm font-bold text-white'>
                            {user?.name?.[0]?.toUpperCase() ?? 'A'}
                        </span>
                    </button>

                    {showProfileMenu && (
                        <div
                            onMouseLeave={() => setShowProfileMenu(false)}
                            className={`absolute right-0 top-12 ${menuBg} border ${border} rounded-xl shadow-xl py-2 px-1 w-48 z-50 space-y-0.5`}
                        >
                            <NavLink
                                to='/settings'
                                onClick={() => setShowProfileMenu(false)}
                                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm ${textMain} ${menuHover} transition-colors`}
                            >
                                <Settings size={15} className='text-[#6769ef]' />
                                Settings
                            </NavLink>

                            <NavLink
                                to='/notifications'
                                onClick={() => setShowProfileMenu(false)}
                                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm ${textMain} ${menuHover} transition-colors`}
                            >
                                <Bell size={15} className='text-[#6769ef]' />
                                Notifications
                            </NavLink>

                            <NavLink
                                to='/queries'
                                onClick={() => setShowProfileMenu(false)}
                                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm ${textMain} ${menuHover} transition-colors`}
                            >
                                <Headset size={15} className='text-[#6769ef]' />
                                Support Queries
                            </NavLink>

                            <div className={`my-1 border-t ${border}`} />

                            <button
                                onClick={logout}
                                className='flex items-center w-full gap-3 px-3 py-2 text-sm text-red-400 transition-colors rounded-lg hover:bg-red-500/10'
                            >
                                <LogOut size={15} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;