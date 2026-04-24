import { useEffect, useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";


// Layout component: applies automatic dark mode based on system preference
// and user's explicit choice saved in localStorage. It toggles the
// `dark` class on <html> so global CSS (or Tailwind) can respond.

const STORAGE_KEY = "theme"; // 'light' | 'dark' | undefined (follow system)

const getPreferredTheme = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    // follow system preference
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
};

const applyThemeClass = (theme) => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
};

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(256);
    // const [loading, setLoading] = useState(true);

    // Track both the actual theme and whether user explicitly set it
    const [themeMode, setThemeMode] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored || "system"; // 'light' | 'dark' | 'system'
    });

    const [theme, setTheme] = useState(() => {
        try {
            return getPreferredTheme();
        } catch (e) {
            return "light";
        }
    });

    // Apply theme on mount and when it changes
    useEffect(() => {
        applyThemeClass(theme);
    }, [theme]);

    // Listen to system changes when user hasn't explicitly chosen
    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = (e) => {
            const stored = localStorage.getItem(STORAGE_KEY);
            // Only follow system if user hasn't set explicit preference
            if (stored !== "light" && stored !== "dark") {
                setTheme(e.matches ? "dark" : "light");
            }
        };

        try {
            // Modern browsers: addEventListener
            if (mq.addEventListener) {
                mq.addEventListener("change", onChange);
            }
            // Older browsers: addListener
            else if (mq.addListener) {
                mq.addListener(onChange);
            }
        } catch (e) {
            // ignore errors
        }

        return () => {
            try {
                if (mq.removeEventListener) {
                    mq.removeEventListener("change", onChange);
                } else if (mq.removeListener) {
                    mq.removeListener(onChange);
                }
            } catch (e) {
                // ignore errors
            }
        };
    }, []);

    // Toggle handler exposed to children via context
    const toggleTheme = useCallback((value) => {
        if (value === "light" || value === "dark") {
            localStorage.setItem(STORAGE_KEY, value);
            setThemeMode(value);
            setTheme(value);
        } else if (value === "system") {
            // clear explicit choice -> follow system
            localStorage.removeItem(STORAGE_KEY);
            setThemeMode("system");
            setTheme(getPreferredTheme());
        }
    }, []);

    // useEffect(() => {
    //     setTimeout(() => {
    //         setLoading(false);
    //     }, 5000);
    // }, []);

    return (
        <>
            {/* {loading ? (
                <div className="flex w-full items-center justify-center min-h-screen">
                    <p>Loading....</p>
                </div>

            ) : ( */}
                <div className={`h-screen flex ${theme === "dark" ? "bg-[#151419]" : "bg-[#ffffff]"}`}>
                        <Sidebar
                            theme={theme}
                            themeMode={themeMode}
                            setTheme={toggleTheme}
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                            sidebarWidth={sidebarWidth}
                            setSidebarWidth={setSidebarWidth}
                        />
                        {/* Main Content Section */}

                        <main
                            className={`flex-1 overflow-y-auto pt-[50px] ${theme === "dark" ? "text-white" : "text-black"}`}
                        >
                            <Navbar
                                themeMode={themeMode}
                                setTheme={toggleTheme}
                                sidebarOpen={sidebarOpen}
                                setSidebarOpen={setSidebarOpen}
                                sidebarWidth={sidebarWidth}
                            />
                        <Outlet context={{ theme, setTheme: toggleTheme, sidebarOpen, setSidebarOpen }} />
                    </main>
                </div>
            {/* )} */}

        </>

    );
};

export default Layout;