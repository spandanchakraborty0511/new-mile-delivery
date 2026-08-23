import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import axios from 'axios';

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const res = await axios.post('/api/auth/register', { 
        fullName, 
        email, 
        phone, 
        password 
      });
      setSuccessMsg(res.data.message || 'Registration successful! You can now log in.');
      // Auto redirect to login after 2s
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err.response?.data?.details) {
        // Express-validator errors
        setError(err.response.data.details.map(d => d.msg).join(', '));
      } else {
        setError(err.response?.data?.error || 'Registration failed. Try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="text-center">
          <Truck className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Create a Customer Account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && <div className="bg-rose-50 text-rose-700 p-3 rounded-md text-sm">{error}</div>}
          {successMsg && <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">{successMsg}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Phone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                placeholder="Min 8 chars, 1 uppercase, 1 number"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Sign up
            </button>
          </div>
          <div className="text-sm text-center">
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
