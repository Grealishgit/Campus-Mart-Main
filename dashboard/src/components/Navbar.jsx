import { Bell, HelpCircle, LogOut, Headset, Menu, Settings } from 'lucide-react'
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'


const Navbar = ({ sidebarOpen, setSidebarOpen, sidebarWidth = 256 }) => {
    const { logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const interval = setInterval(() => {
            setSystemTime(new Date().toLocaleTimeString());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Get todays date in this format 27th January, 2024
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const systemDate = today.toLocaleDateString('en-US', options);
    // console.log(systemDate);

    return (
        <div
            className='fixed top-0 left-0 z-50 border-b border-[#933942]/30 shadow-lg backdrop-blur-sm transition-all duration-200'
            style={{
                marginLeft: sidebarOpen ? sidebarWidth : 0,
                width: sidebarOpen ? `calc(100% - ${sidebarWidth}px)` : '100%',
            }}
        >
            <div className='flex flex-row px-4 py-3 bg-gray-800 text-white justify-between items-center w-full'>
                <div className='flex items-center gap-3'>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className='text-white/70 hover:text-white transition-colors cursor-pointer'
                    >
                        <Menu size={20} />
                    </button>
                    {/* <h2 className='font-semibold text-sm text-white/80'>
                        CribFinder <span className='text-[#933942] text-lg'>Admin</span>
                    </h2> */}

                    <NavLink to='/queries' className='font-medium flex items-center gap-2 bg-[#933942]  px-3 py-1 rounded-sm text-white'>
                        <Headset size={15} />
                        Support Queries
                    </NavLink>
                </div>

                <div className='md:flex hidden text-center items-center gap-2'>
                    <p className='font-semibold text-sm md:text-md'>{systemDate}</p> |
                    <p className='font-semibold md:text-md text-sm text-[#933942]'>{systemTime}</p>
                </div>

                <div className='flex relative items-center gap-3'>

                    <button className='text-right'
                        onClick={() => setShowProfileMenu(!showProfileMenu)}>
                        <p className='text-sm font-medium'>Admin</p>
                        <p className='text-xs text-white/40'>System Admin</p>
                    </button>

                    <button onMouseOver={() => setShowProfileMenu(!showProfileMenu)}
                        className='w-8 h-8 cursor-pointer rounded-full hover:border border-gray-300 bg-[#933942] flex items-center justify-center'>
                        <span className='text-white  text-sm font-bold'>
                            A
                        </span>
                    </button>

                    {showProfileMenu && (
                        <div onMouseLeave={() => setShowProfileMenu(!showProfileMenu)} className='absolute right-4 space-y-1 px-1 top-13 bg-gray-700 rounded-md shadow-lg py-2 w-48 z-50'>

                            <NavLink to='/settings' onClick={() => setShowProfileMenu(false)}
                                className='block w-full rounded-md text-left px-4 py-2 text-sm text-white hover:bg-gray-600'>
                                <Settings size={16} className='inline-block mr-4' />
                                Settings
                            </NavLink>

                            <NavLink to='/notifications' className='block w-full rounded-md text-left px-4 py-2 text-sm text-white hover:bg-gray-600'>
                                <Bell size={16} className='inline-block mr-4' />
                                Notifications
                            </NavLink>

                            <NavLink to='/queries' className='block w-full rounded-md text-left px-4 py-2 text-sm text-white hover:bg-gray-600'>
                                <Headset size={16} className='inline-block mr-4' />
                                Support Queries
                            </NavLink>

                            <button onClick={logout} className='block w-full bg-gray-900 rounded-md text-left px-4 py-2 text-sm text-white hover:bg-red-400'>
                                <LogOut size={16} className='inline-block mr-5' />
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