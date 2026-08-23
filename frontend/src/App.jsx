import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/customer/Dashboard';
import CreateOrder from './pages/customer/CreateOrder';
import AgentDashboard from './pages/agent/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import RateCards from './pages/admin/RateCards';
import Zones from './pages/admin/Zones';
import Agents from './pages/admin/Agents';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<DashboardLayout />}>
          {/* Customer Routes */}
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/create-order" element={<CreateOrder />} />
          
          {/* Agent Routes */}
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/rate-cards" element={<RateCards />} />
          <Route path="/admin/zones" element={<Zones />} />
          <Route path="/admin/agents" element={<Agents />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
