import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Trash2 } from 'lucide-react';

export default function RateCards() {
  const [zones, setZones] = useState([]);
  const [rateCards, setRateCards] = useState([]);
  
  // New Rate Card State
  const [sourceZoneId, setSourceZoneId] = useState('');
  const [destinationZoneId, setDestinationZoneId] = useState('');
  const [orderType, setOrderType] = useState('B2C');
  const [baseFee, setBaseFee] = useState('');
  const [perKgRate, setPerKgRate] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [zonesRes, ratesRes] = await Promise.all([
        axios.get('/api/zones', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/rate-cards', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setZones(zonesRes.data.zones || []);
      setRateCards(ratesRes.data.rateCards || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRateCard = async (e) => {
    e.preventDefault();
    if (!sourceZoneId || !destinationZoneId || !baseFee || !perKgRate) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/rate-cards', {
        sourceZoneId,
        destinationZoneId,
        orderType,
        baseFee: parseFloat(baseFee),
        perKgRate: parseFloat(perKgRate)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBaseFee('');
      setPerKgRate('');
      setError('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add rate card');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/rate-cards/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getZoneName = (id) => {
    const zone = zones.find(z => z.id === id);
    return zone ? zone.name.split(',')[0] : 'Unknown';
  };

  return (
    <div className="p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-slate-900">Rate Cards</h1>
          <p className="mt-2 text-sm text-slate-700">Configure base fees and per kg rates between zones.</p>
        </div>
      </div>
      
      {/* Create Rate Card Form */}
      <div className="mt-6 bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:rounded-lg mb-8">
        <h3 className="text-lg font-medium mb-4">Add Rate Card</h3>
        <form onSubmit={handleAddRateCard} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Source Zone</label>
              <select 
                value={sourceZoneId} 
                onChange={e => setSourceZoneId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary-500"
              >
                <option value="">Select...</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name.split(',')[0]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Destination Zone</label>
              <select 
                value={destinationZoneId} 
                onChange={e => setDestinationZoneId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary-500"
              >
                <option value="">Select...</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name.split(',')[0]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
              <select 
                value={orderType} 
                onChange={e => setOrderType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary-500"
              >
                <option value="B2C">B2C</option>
                <option value="B2B">B2B</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Base Fee (₹)</label>
              <input 
                type="number" 
                value={baseFee}
                onChange={e => setBaseFee(e.target.value)}
                placeholder="e.g. 50"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Per Kg Rate (₹)</label>
              <input 
                type="number" 
                value={perKgRate}
                onChange={e => setPerKgRate(e.target.value)}
                placeholder="e.g. 20"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Save Rate
            </button>
          </div>
          {error && <p className="text-rose-600 text-sm mt-2">{error}</p>}
        </form>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-lg overflow-hidden">
        {rateCards.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            No rate cards configured yet.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Base Fee</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Per Kg</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {rateCards.map((rc) => (
                <tr key={rc.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{getZoneName(rc.source_zone_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{getZoneName(rc.destination_zone_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                      {rc.order_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900">₹{rc.base_fee}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900">₹{rc.per_kg_rate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(rc.id)} className="text-rose-500 hover:text-rose-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
