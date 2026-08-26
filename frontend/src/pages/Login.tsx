import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { loginUser } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold">⚡</div>
        <span className="font-extrabold text-xl tracking-tight text-white">RecoverAI</span>
      </Link>

      <div className="glass-card w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-gray-400 text-sm">Enter your credentials to access your agent</p>
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
