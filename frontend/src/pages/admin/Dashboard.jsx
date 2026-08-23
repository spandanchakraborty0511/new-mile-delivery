import { Users, Package, AlertTriangle, TrendingUp, TrendingDown, Map } from 'lucide-react';

const stats = [
  { name: 'Total Orders (Today)', value: '1,234', icon: Package, change: '+12%', changeType: 'increase' },
  { name: 'Active Agents', value: '42', icon: Users, change: '+4', changeType: 'increase' },
  { name: 'Failed Deliveries', value: '12', icon: AlertTriangle, change: '-2.5%', changeType: 'decrease' },
  { name: 'Active Zones', value: '8', icon: Map, change: '0', changeType: 'neutral' },
];

export default function AdminDashboard() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
        <p className="mt-1 text-sm text-slate-500">System-wide performance and metrics.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <dt>
              <div className="absolute bg-primary-100 rounded-md p-3">
                <item.icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-slate-500 truncate">{item.name}</p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  item.changeType === 'increase' ? 'text-green-600' : item.changeType === 'decrease' ? 'text-rose-600' : 'text-slate-500'
                }`}
              >
                {item.changeType === 'increase' ? (
                  <TrendingUp className="self-center flex-shrink-0 h-4 w-4 mr-1" aria-hidden="true" />
                ) : item.changeType === 'decrease' ? (
                  <TrendingDown className="self-center flex-shrink-0 h-4 w-4 mr-1" aria-hidden="true" />
                ) : null}
                <span className="sr-only">
                  {item.changeType === 'increase' ? 'Increased by ' : item.changeType === 'decrease' ? 'Decreased by ' : ''}
                </span>
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </div>
      
      {/* Further widgets could go here */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6 h-80 flex items-center justify-center text-slate-400">
          Chart Placeholder: Order Volume over Time
        </div>
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6 h-80 flex items-center justify-center text-slate-400">
          Chart Placeholder: Zone Performance (Delivery vs Fail)
        </div>
      </div>
    </div>
  );
}
