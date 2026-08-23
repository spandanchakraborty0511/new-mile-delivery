import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Package, Map, Settings, Users, LogOut, FileText, Truck, LayoutDashboard } from 'lucide-react';
import { clsx } from 'clsx';
import AIChatWidget from '../components/AIChatWidget';
// In a real app, role would come from auth context/store
// Mocking it for now
// Role is now evaluated inside the component
const navigation = {
  customer: [
    { name: 'Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
    { name: 'New Order', href: '/customer/create-order', icon: Package },
  ],
  delivery_agent: [
    { name: 'My Deliveries', href: '/agent/dashboard', icon: Truck },
  ],
  admin: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Zones', href: '/admin/zones', icon: Map },
    { name: 'Rate Cards', href: '/admin/rate-cards', icon: FileText },
    { name: 'Agents', href: '/admin/agents', icon: Users },
  ],
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role') || 'admin';
  const links = navigation[role] || [];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Truck className="w-6 h-6 text-primary-600 mr-2" />
          <span className="font-bold text-slate-900 text-lg">DeliveryTracker</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {links.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  isActive ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                )}
              >
                <item.icon
                  className={clsx(
                    isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-500',
                    'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-slate-400" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar for mobile */}
        <div className="md:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4">
          <div className="flex items-center">
            <Truck className="w-6 h-6 text-primary-600 mr-2" />
            <span className="font-bold text-slate-900 text-lg">DeliveryTracker</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto relative">
          <Outlet />
          <AIChatWidget />
        </main>
      </div>
    </div>
  );
}
