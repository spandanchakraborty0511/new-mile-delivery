import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Calculator, Info, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import axios from 'axios';

export default function CreateOrder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [orderType, setOrderType] = useState('B2C');
  const [paymentType, setPaymentType] = useState('Prepaid');
  
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupPincode, setPickupPincode] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [dropPincode, setDropPincode] = useState('');
  
  const [actualWeight, setActualWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');

  const handleCalculateQuote = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/orders/quote', {
        pickupPincode,
        dropPincode,
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        actualWeight: parseFloat(actualWeight),
        orderType,
        paymentType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuote(res.data.quote);
      setStep(2);
    } catch (err) {
      if (err.response?.data?.details) {
        setError('Validation failed: ' + err.response.data.details.map(d => d.msg).join(', '));
      } else {
        setError(err.response?.data?.error || 'Failed to calculate quote. Make sure pincodes are mapped to zones and rates exist!');
      }
    }
  };

  const handlePlaceOrder = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/orders', {
        pickupAddress,
        pickupPincode,
        dropAddress,
        dropPincode,
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        actualWeight: parseFloat(actualWeight),
        orderType,
        paymentType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Order placed successfully!');
      navigate('/customer/dashboard');
    } catch (err) {
      if (err.response?.data?.details) {
        setError('Validation failed: ' + err.response.data.details.map(d => d.msg).join(', '));
      } else {
        setError(err.response?.data?.error || 'Failed to place order.');
      }
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create New Order</h1>
        <p className="mt-1 text-sm text-slate-500">Fill in the details to generate a rate quote and place your order.</p>
        {error && <div className="mt-4 bg-rose-50 text-rose-700 p-3 rounded-md text-sm font-medium">{error}</div>}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          
          {/* Order Details Form */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center">
              <MapPin className="w-5 h-5 text-slate-400 mr-2" />
              <h2 className="text-lg font-medium text-slate-900">Location Details</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-600">Pickup Address</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Full Address (Search with GMap)</label>
                    <AddressAutocomplete 
                      placeholder="Search building, street, area" 
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                      value={pickupAddress}
                      onChange={e => setPickupAddress(e.target.value)}
                      onAddressSelect={(data) => {
                        setPickupAddress(data.address);
                        if (data.pincode) setPickupPincode(data.pincode);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Pincode (Auto-filled)</label>
                    <input 
                      type="text" 
                      value={pickupPincode}
                      onChange={e => setPickupPincode(e.target.value)}
                      placeholder="e.g. 560100" 
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-600">Drop-off Address</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Full Address (Search with GMap)</label>
                    <AddressAutocomplete 
                      placeholder="Search building, street, area" 
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                      value={dropAddress}
                      onChange={e => setDropAddress(e.target.value)}
                      onAddressSelect={(data) => {
                        setDropAddress(data.address);
                        if (data.pincode) setDropPincode(data.pincode);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Pincode (Auto-filled)</label>
                    <input 
                      type="text" 
                      value={dropPincode}
                      onChange={e => setDropPincode(e.target.value)}
                      placeholder="e.g. 560034" 
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center">
              <Package className="w-5 h-5 text-slate-400 mr-2" />
              <h2 className="text-lg font-medium text-slate-900">Package Information</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">Actual Weight (kg)</label>
                <input 
                  type="number" step="0.1" 
                  value={actualWeight} onChange={e => setActualWeight(e.target.value)}
                  placeholder="e.g. 1.5" 
                  className="mt-1 block w-full max-w-xs px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dimensions (cm)</label>
                <div className="flex items-center space-x-2 max-w-md">
                  <input type="number" value={length} onChange={e => setLength(e.target.value)} placeholder="L" className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                  <span className="text-slate-400">×</span>
                  <input type="number" value={width} onChange={e => setWidth(e.target.value)} placeholder="W" className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                  <span className="text-slate-400">×</span>
                  <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="H" className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <p className="mt-2 text-xs text-slate-500">Used to calculate volumetric weight (L×W×H / 5000)</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Order Type</label>
                  <div className="flex space-x-4">
                    {['B2B', 'B2C'].map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="radio"
                          name="orderType"
                          value={type}
                          checked={orderType === type}
                          onChange={(e) => setOrderType(e.target.value)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300"
                        />
                        <span className="ml-2 text-sm text-slate-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Type</label>
                  <div className="flex space-x-4">
                    {['Prepaid', 'COD'].map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="radio"
                          name="paymentType"
                          value={type}
                          checked={paymentType === type}
                          onChange={(e) => setPaymentType(e.target.value)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300"
                        />
                        <span className="ml-2 text-sm text-slate-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCalculateQuote}
                className="w-full sm:w-auto inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Rate Quote
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar / Quote Panel */}
        {step === 2 && quote && (
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg border border-primary-100 overflow-hidden sticky top-6">
              <div className="bg-primary-600 px-4 py-3">
                <h3 className="text-sm font-medium text-white uppercase tracking-wider">Rate Quote Summary</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Volumetric Weight</span>
                  <span className="font-medium text-slate-900">{quote.volumetricWeight} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Chargeable Weight</span>
                  <span className="font-medium text-slate-900">{quote.chargeableWeight} kg</span>
                </div>
                
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Base Fee</span>
                    <span className="font-medium text-slate-900">₹{parseFloat(quote.baseFee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Weight Charge</span>
                    <span className="font-medium text-slate-900">₹{parseFloat(quote.weightCharge).toFixed(2)}</span>
                  </div>
                  {parseFloat(quote.codSurcharge) > 0 && (
                    <div className="flex justify-between text-sm text-rose-600">
                      <span>COD Surcharge</span>
                      <span className="font-medium">₹{parseFloat(quote.codSurcharge).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                  <span className="text-base font-semibold text-slate-900">Total Charge</span>
                  <span className="text-xl font-bold text-primary-600">₹{parseFloat(quote.totalCharge).toFixed(2)}</span>
                </div>

                {parseFloat(quote.codSurcharge) > 0 && (
                  <div className="bg-rose-50 rounded p-3 flex items-start mt-4">
                    <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    <p className="ml-2 text-xs text-rose-700">COD orders may have a higher failure risk and include a surcharge.</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Confirm & Place Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
