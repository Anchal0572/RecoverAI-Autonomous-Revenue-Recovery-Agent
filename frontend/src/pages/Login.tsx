import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { loginUser } from '../api';
import BrandLogo from '../components/BrandLogo';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoQuickLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await loginUser({ email: 'admin@company.com', password: 'Password123!' });
      setLoading(false);
      if (res.token) {
        localStorage.setItem('token', res.token);
        navigate('/dashboard');
      } else {
        setError(res.error || 'Demo login failed');
      }
    } catch {
      setLoading(false);
      setError('Network error during quick login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const res = await loginUser({ email, password });
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else if (res.token) {
        localStorage.setItem('token', res.token);
        navigate('/dashboard');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setLoading(false);
      setError('An error occurred connecting to the server.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
      <div className="absolute -top-[300px] -right-[300px] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

      <Link to="/" className="mb-8 flex items-center gap-2">
        <BrandLogo size="lg" badgeText="ENTERPRISE" />
      </Link>

      <div className="glass-card w-full max-w-md p-8 relative z-10 border border-slate-700/60 shadow-2xl rounded-2xl bg-slate-900/80 backdrop-blur-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to RevPulse</h1>
          <p className="text-gray-400 text-sm">Autonomous Revenue Recovery & Payment Diagnostics</p>
        </div>

        {/* Quick Demo Access banner */}
        <div className="mb-6 p-3.5 bg-blue-950/60 border border-blue-500/40 rounded-xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Evaluation Mode Ready
            </span>
            <span className="text-[11px] text-blue-200 bg-blue-900/80 px-2 py-0.5 rounded font-mono">admin@company.com</span>
          </div>
          <button
            type="button"
            onClick={handleDemoQuickLogin}
            disabled={loading}
            className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
          >
            ⚡ Enter Live Dashboard (1-Click)
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email Address</label>
            <Input 
              type="email" 
              placeholder="admin@company.com" 
              className="h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
            </div>
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button 
            className="w-full h-11 mt-6 text-base flex justify-center items-center gap-2" 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">Request Access</Link>
        </div>
      </div>
    </div>
  );
}
