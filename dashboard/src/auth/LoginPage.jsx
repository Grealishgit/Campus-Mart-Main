import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
    const { login, loading, error } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        login(email, password);
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#933942]">CampusMart</h1>
                    <p className="text-white/50 text-sm mt-1">Admin Portal</p>
                </div>

                {/* Card */}
                <div className="bg-gray-800 rounded-xl p-8 border border-[#933942]/30 shadow-xl">
                    <h2 className="text-white font-semibold text-lg mb-6">Sign in to your account</h2>

                    {error && (
                        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-white/70 text-sm mb-1.5 block">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="admin@example.com"
                                className="w-full bg-gray-900 border border-gray-700 focus:border-[#933942] outline-none text-white text-sm rounded-lg px-4 py-2.5 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="text-white/70 text-sm mb-1.5 block">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-gray-900 border border-gray-700 focus:border-[#933942] outline-none text-white text-sm rounded-lg px-4 py-2.5 transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#933942] hover:bg-[#7a2f36] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
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