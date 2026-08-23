import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck } from 'lucide-react';

import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { accessToken, user } = res.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('role', user.role);
      localStorage.setItem('user', JSON.stringify(user));
      
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'delivery_agent') navigate('/agent/dashboard');
      else navigate('/customer/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="text-center">
          <Truck className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Sign in to your account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && <div className="bg-rose-50 text-rose-700 p-3 rounded-md text-sm">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Sign in
            </button>
          </div>
          <div className="text-sm text-center">
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
