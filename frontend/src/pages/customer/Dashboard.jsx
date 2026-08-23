import { useState } from 'react';
import { Package, Truck, CheckCircle, Clock, MapPin, ChevronRight, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

const MOCK_ORDERS = [
  {
    id: 'ORD-8F92A',
    status: 'In Transit',
    createdAt: new Date(2026, 7, 24, 10, 30),
    pickup: '123 Tech Park, Bangalore, 560100',
    drop: '456 Startup Blvd, Koramangala, 560034',
    totalCharge: 150.00,
    paymentType: 'Prepaid',
    agentInfo: { name: 'Ramesh Kumar', phone: '+91 9876543210' },
    timeline: [
      { status: 'Pending', time: new Date(2026, 7, 24, 10, 30) },
      { status: 'Assigned', time: new Date(2026, 7, 24, 10, 45) },
      { status: 'Picked Up', time: new Date(2026, 7, 24, 11, 15) },
      { status: 'In Transit', time: new Date(2026, 7, 24, 12, 0) },
    ]
  },
  {
    id: 'ORD-3C11B',
    status: 'Delivered',
    createdAt: new Date(2026, 7, 20, 14, 20),
    pickup: 'Warehouse A, Peenya, 560058',
    drop: 'Retail Store, MG Road, 560001',
    totalCharge: 220.50,
    paymentType: 'COD',
    agentInfo: { name: 'Suresh M', phone: '+91 9123456789' },
    timeline: [
      { status: 'Pending', time: new Date(2026, 7, 20, 14, 20) },
      { status: 'Picked Up', time: new Date(2026, 7, 20, 15, 10) },
      { status: 'Delivered', time: new Date(2026, 7, 20, 16, 45) },
    ]
  },
  {
    id: 'ORD-9X44C',
    status: 'Failed',
    createdAt: new Date(2026, 7, 22, 9, 15),
    pickup: 'Home Delivery, HSR Layout, 560102',
    drop: 'Office, Indiranagar, 560038',
    totalCharge: 85.00,
    paymentType: 'Prepaid',
    agentInfo: { name: 'Anil D', phone: '+91 9988776655' },
    timeline: [
      { status: 'Pending', time: new Date(2026, 7, 22, 9, 15) },
      { status: 'Picked Up', time: new Date(2026, 7, 22, 10, 0) },
      { status: 'Failed', time: new Date(2026, 7, 22, 11, 30), notes: 'Customer not available at location' },
    ]
  }
];

const statusStyles = {
  'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Assigned': 'bg-blue-100 text-blue-800 border-blue-200',
  'Picked Up': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'In Transit': 'bg-purple-100 text-purple-800 border-purple-200',
  'Out for Delivery': 'bg-orange-100 text-orange-800 border-orange-200',
  'Delivered': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Failed': 'bg-rose-100 text-rose-800 border-rose-200',
};

const statusIcons = {
  'Pending': Clock,
  'Assigned': CheckCircle,
  'Picked Up': Package,
  'In Transit': Truck,
  'Out for Delivery': Truck,
  'Delivered': CheckCircle,
  'Failed': XCircle,
};

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('active'); // active, history
  
  const activeOrders = MOCK_ORDERS.filter(o => !['Delivered', 'Failed'].includes(o.status));
  const pastOrders = MOCK_ORDERS.filter(o => ['Delivered', 'Failed'].includes(o.status));
  
  const displayOrders = activeTab === 'active' ? activeOrders : pastOrders;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Deliveries</h1>
          <p className="mt-1 text-sm text-slate-500">Track and manage your packages.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setActiveTab('active')}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'active' ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            )}
          >
            Active Orders ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'history' ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            )}
          >
            Past Orders ({pastOrders.length})
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {displayOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No {activeTab} orders found</h3>
            <p className="mt-1 text-slate-500">When you place a new order, it will appear here.</p>
          </div>
        ) : (
          displayOrders.map(order => {
            const StatusIcon = statusIcons[order.status] || Package;
            
            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Order ID</p>
                      <p className="text-sm font-medium text-slate-900">{order.id}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Date Placed</p>
                      <p className="text-sm font-medium text-slate-900">{format(order.createdAt, 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border', statusStyles[order.status])}>
                      <StatusIcon className="w-3.5 h-3.5 mr-1" />
                      {order.status}
                    </span>
                    <button className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center">
                      View Details
                      <ChevronRight className="w-4 h-4 ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div className="relative">
                      <div className="absolute top-2 left-2.5 h-full w-0.5 bg-slate-200 -z-10"></div>
                      
                      <div className="flex items-start mb-6">
                        <div className="flex-shrink-0 bg-white p-1">
                          <MapPin className="w-5 h-5 text-primary-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pickup</p>
                          <p className="text-sm text-slate-900 mt-0.5">{order.pickup}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 bg-white p-1">
                          <MapPin className="w-5 h-5 text-rose-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Drop-off</p>
                          <p className="text-sm text-slate-900 mt-0.5">{order.drop}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-slate-500">Payment</span>
                      <span className="text-sm font-medium text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{order.paymentType}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-slate-500">Total Charge</span>
                      <span className="text-lg font-bold text-slate-900">₹{order.totalCharge.toFixed(2)}</span>
                    </div>
                    
                    {order.agentInfo && order.status !== 'Pending' && (
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Delivery Agent</p>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                            {order.agentInfo.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{order.agentInfo.name}</p>
                            <p className="text-xs text-slate-500">{order.agentInfo.phone}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
