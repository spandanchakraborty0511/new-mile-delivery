import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Truck, CheckCircle, XCircle, MapPin, Loader, FileText } from 'lucide-react';
import { clsx } from 'clsx';

export default function AgentDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/agent/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/agent/orders/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Assigned': return 'bg-blue-100 text-blue-800';
      case 'Picked Up': return 'bg-purple-100 text-purple-800';
      case 'In Transit': return 'bg-indigo-100 text-indigo-800';
      case 'Out for Delivery': return 'bg-orange-100 text-orange-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Failed': return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getNextStatuses = (current) => {
    switch (current) {
      case 'Assigned': return ['Picked Up'];
      case 'Picked Up': return ['In Transit'];
      case 'In Transit': return ['Out for Delivery'];
      case 'Out for Delivery': return ['Delivered', 'Failed'];
      default: return [];
    }
  };

  return (
    <div className="p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-slate-900">My Deliveries</h1>
          <p className="mt-2 text-sm text-slate-700">Manage and update the statuses of your assigned packages.</p>
        </div>
      </div>
      
      <div className="mt-8 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-4" />
            <p className="text-slate-500">Loading deliveries...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-200">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No active deliveries</h3>
            <p className="text-slate-500 mt-1">You currently have no packages assigned to you.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
            {orders.map((order) => {
              const nextStatuses = getNextStatuses(order.status);
              
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</span>
                      <h3 className="text-sm font-medium text-slate-900 mt-1">{order.id.split('-')[0].toUpperCase()}</h3>
                    </div>
                    <span className={clsx('px-2.5 py-1 text-xs font-semibold rounded-full', getStatusColor(order.status))}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase">Pickup Location</p>
                        <p className="text-sm text-slate-900 mt-1">{order.pickup_address}</p>
                      </div>
                    </div>
                    
                    <div className="ml-2.5 w-0.5 h-6 bg-slate-200"></div>
                    
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-rose-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase">Drop-off Location</p>
                        <p className="text-sm text-slate-900 mt-1">{order.drop_address}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                      <div className="flex items-center text-slate-700">
                        <FileText className="w-4 h-4 mr-2 text-slate-400" />
                        <span className="font-medium">{order.payment_type}</span>
                        {order.payment_type === 'COD' && (
                          <span className="ml-2 text-rose-600 font-bold">₹{order.total_charge}</span>
                        )}
                      </div>
                      <div className="text-slate-500">
                        {order.actual_weight} kg
                      </div>
                    </div>
                  </div>
                  
                  {nextStatuses.length > 0 && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200">
                      <p className="text-xs font-medium text-slate-500 mb-3 text-center uppercase tracking-wider">Update Status To</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {nextStatuses.map(status => (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(order.id, status)}
                            disabled={updating === order.id}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            {updating === order.id ? <Loader className="w-4 h-4 animate-spin mr-2" /> : (
                              status === 'Delivered' ? <CheckCircle className="w-4 h-4 mr-2" /> :
                              status === 'Failed' ? <XCircle className="w-4 h-4 mr-2" /> :
                              <Truck className="w-4 h-4 mr-2" />
                            )}
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
