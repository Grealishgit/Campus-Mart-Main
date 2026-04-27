import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
    const { login, loading, error } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isDark, setIsDark] = useState(true);

    // Detect theme from html class or localStorage
    useEffect(() => {
        const checkTheme = () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            setIsDark(isDarkMode);
        };
        checkTheme();
        // Watch for theme changes
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        login(email, password);
    };

    // Theme-based classes
    const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-white/50' : 'text-gray-500';
    const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
    const cardBorder = isDark ? 'border-[#933942]/30' : 'border-gray-200';
    const inputBg = isDark ? 'bg-gray-900' : 'bg-gray-50';
    const inputBorder = isDark ? 'border-gray-700' : 'border-gray-300';
    const inputFocus = isDark ? 'focus:border-[#933942]' : 'focus:border-[#933942]';
    const inputText = isDark ? 'text-white' : 'text-gray-900';
    const labelText = isDark ? 'text-white/70' : 'text-gray-600';
    const errorBg = isDark ? 'bg-red-500/10' : 'bg-red-50';
    const errorBorder = isDark ? 'border-red-500/30' : 'border-red-200';
    const errorText = isDark ? 'text-red-400' : 'text-red-600';

    return (
        <div className={`min-h-screen ${bgColor} flex items-center justify-center px-4 transition-colors duration-200`}>
            <div className="w-full max-w-md">
                {/* Logo */}


                {/* Card */}
                <div className={`${cardBg} rounded-xl p-8 border ${cardBorder} shadow-xl transition-colors duration-200`}>
                    <div className="mb-8 text-center">
                        <h1 className={`text-3xl font-bold text-[#6769ef]`}>CampusMart</h1>
                        <p className={`${textMuted} text-sm mt-1`}>Admin Portal</p>
                    </div>
                    <h2 className={`${textPrimary} font-semibold text-lg mb-6`}>Sign in to your account</h2>

                    {error && (
                        <div className={`mb-4 px-4 py-3 ${errorBg} border ${errorBorder} rounded-lg ${errorText} text-sm`}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className={`${labelText} text-sm mb-1.5 block`}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="admin@example.com"
                                className={`w-full ${inputBg} border ${inputBorder} ${inputFocus} outline-none ${inputText} text-sm rounded-lg px-4 py-2.5 transition-colors`}
                            />
                        </div>

                        <div>
                            <label className={`${labelText} text-sm mb-1.5 block`}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className={`w-full ${inputBg} border ${inputBorder} ${inputFocus} outline-none ${inputText} text-sm rounded-lg px-4 py-2.5 transition-colors`}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full cursor-pointer bg-[#6769ef] hover:bg-[#5557d4] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;