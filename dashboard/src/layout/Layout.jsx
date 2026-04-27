import { useEffect, useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import LoginPage from "../auth/LoginPage";

const STORAGE_KEY = "theme";

const getPreferredTheme = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
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
    const [themeMode, setThemeMode] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored || "system";
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

    // Listen to system changes
    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = (e) => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored !== "light" && stored !== "dark") {
                setTheme(e.matches ? "dark" : "light");
            }
        };

        try {
            if (mq.addEventListener) {
                mq.addEventListener("change", onChange);
            } else if (mq.addListener) {
                mq.addListener(onChange);
            }
        } catch (e) {}

        return () => {
            try {
                if (mq.removeEventListener) {
                    mq.removeEventListener("change", onChange);
                } else if (mq.removeListener) {
                    mq.removeListener(onChange);
                }
            } catch (e) {}
        };
    }, []);

    const toggleTheme = useCallback((value) => {
        if (value === "light" || value === "dark") {
            localStorage.setItem(STORAGE_KEY, value);
            setThemeMode(value);
            setTheme(value);
        } else if (value === "system") {
            localStorage.removeItem(STORAGE_KEY);
            setThemeMode("system");
            setTheme(getPreferredTheme());
        }
    }, []);

    return (
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
            
            <main className={`flex-1 overflow-y-auto pt-16 ${theme === "dark" ? "text-white" : "text-black"}`}>
                <Navbar
                    theme={theme}
                    themeMode={themeMode}
                    setTheme={toggleTheme}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    sidebarWidth={sidebarWidth}
                />
                <Outlet context={{ theme, setTheme: toggleTheme, sidebarOpen, setSidebarOpen }} />

            </main>
        </div>
    );
};

export default Layout;