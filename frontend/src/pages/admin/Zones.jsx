import { useState, useEffect } from 'react';
import axios from 'axios';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import { X, Plus } from 'lucide-react';

export default function Zones() {
  const [zones, setZones] = useState([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [error, setError] = useState('');
  const [activeZone, setActiveZone] = useState(null);
  const [activePincodes, setActivePincodes] = useState([]);
  const [newPincode, setNewPincode] = useState('');
  
  const fetchZones = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/zones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setZones(res.data.zones || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleAddZone = async (e) => {
    e.preventDefault();
    if (!newZoneName) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/zones', { name: newZoneName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewZoneName('');
      setError('');
      fetchZones();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add zone');
    }
  };

  const handleManagePincodes = async (zone) => {
    setActiveZone(zone);
    fetchPincodes(zone.id);
  };

  const fetchPincodes = async (zoneId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/zones/${zoneId}/pincodes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivePincodes(res.data.pincodes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPincode = async (e) => {
    e.preventDefault();
    if (!newPincode || !activeZone) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/zones/${activeZone.id}/pincodes`, { pincode: newPincode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewPincode('');
      fetchPincodes(activeZone.id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add pincode');
    }
  };

  const handleRemovePincode = async (pincode) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/zones/pincodes/${pincode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPincodes(activeZone.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-slate-900">Zones Configuration</h1>
          <p className="mt-2 text-sm text-slate-700">Manage delivery zones and pincode mappings.</p>
        </div>
      </div>
      
      <div className="mt-6 bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:rounded-lg mb-8">
        <h3 className="text-lg font-medium mb-4">Add New Zone</h3>
        <form onSubmit={handleAddZone} className="flex gap-4">
          <div className="flex-1">
            <AddressAutocomplete 
              placeholder="Search Google Maps for a city, area, or region..." 
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              onAddressSelect={(data) => setNewZoneName(data.address)}
            />
          </div>
          <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
            Create Zone
          </button>
        </form>
        {error && <p className="text-rose-600 mt-2 text-sm">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-lg overflow-hidden">
          {zones.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              No zones configured yet.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Zone Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {zones.map((zone) => (
                  <tr key={zone.id} className={activeZone?.id === zone.id ? 'bg-primary-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {zone.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleManagePincodes(zone)}
                        className="text-primary-600 hover:text-primary-900 font-semibold"
                      >
                        Manage Pincodes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pincode Panel */}
        {activeZone && (
          <div className="bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-lg overflow-hidden flex flex-col max-h-[500px]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-medium text-slate-900">Pincodes for {activeZone.name.split(',')[0]}</h3>
            </div>
            
            <div className="p-4 border-b border-slate-200">
              <form onSubmit={handleAddPincode} className="flex gap-2">
                <input 
                  type="text" 
                  value={newPincode}
                  onChange={e => setNewPincode(e.target.value)}
                  placeholder="Enter 6-digit PIN"
                  maxLength={6}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
                <button type="submit" className="bg-primary-600 text-white p-2 rounded-md hover:bg-primary-700">
                  <Plus className="w-5 h-5" />
                </button>
              </form>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {activePincodes.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No pincodes added yet.</p>
              ) : (
                <ul className="space-y-2">
                  {activePincodes.map(p => (
                    <li key={p} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-md border border-slate-100">
                      <span className="text-sm font-medium text-slate-700">{p}</span>
                      <button onClick={() => handleRemovePincode(p)} className="text-slate-400 hover:text-rose-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
