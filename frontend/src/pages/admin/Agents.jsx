import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, User, Phone, Mail } from 'lucide-react';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/agents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgents(res.data.agents || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/agents', {
        fullName, email, phone, password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setError('');
      setShowForm(false);
      fetchAgents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create agent');
    }
  };

  return (
    <div className="p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-slate-900">Delivery Agents</h1>
          <p className="mt-2 text-sm text-slate-700">Manage your fleet of delivery personnel.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button 
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Agent
          </button>
        </div>
      </div>
      
      {showForm && (
        <div className="mt-6 bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:rounded-lg mb-8">
          <h3 className="text-lg font-medium mb-4">Create Agent Account</h3>
          <form onSubmit={handleCreateAgent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                <input 
                  type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input 
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                <input 
                  type="text" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Password</label>
                <input 
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700">
                Save
              </button>
            </div>
            {error && <p className="text-rose-600 text-sm mt-2">{error}</p>}
          </form>
        </div>
      )}

      <div className="mt-8 bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-lg overflow-hidden">
        {agents.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            No agents registered yet.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Agent Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Current Capacity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{agent.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex items-center"><Mail className="w-4 h-4 mr-2" />{agent.email}</div>
                    <div className="flex items-center mt-1"><Phone className="w-4 h-4 mr-2" />{agent.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${agent.is_available ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'}`}>
                      {agent.is_available ? 'Available' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                    Max: {agent.max_concurrent_orders}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
