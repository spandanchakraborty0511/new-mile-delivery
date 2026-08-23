import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function AddressAutocomplete({ onAddressSelect, placeholder, className, value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      // Using OpenStreetMap Nominatim (Free, no API key required) as a fallback since Google Maps requires billing
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`);
      setSuggestions(res.data);
      setShowDropdown(true);
    } catch (err) {
      console.error('Error fetching addresses', err);
    }
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAddress(value);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleSelect = (place) => {
    setShowDropdown(false);
    
    const pincode = place.address?.postcode || '';
    const formattedAddress = place.display_name;
    
    // Call the parent's onChange so the input updates immediately
    if (onChange) {
      onChange({ target: { value: formattedAddress } });
    }

    onAddressSelect({
      address: formattedAddress,
      lat: place.lat,
      lng: place.lon,
      pincode
    });
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        placeholder={placeholder || 'Search for location...'}
        className={className}
        value={value}
        onChange={(e) => {
          if (onChange) onChange(e);
          setShowDropdown(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setShowDropdown(true);
        }}
      />
      
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {suggestions.map((place) => (
            <li
              key={place.place_id}
              className="text-slate-900 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-primary-50 hover:text-primary-900 transition-colors"
              onClick={() => handleSelect(place)}
            >
              <span className="block truncate font-medium">{place.display_name.split(',')[0]}</span>
              <span className="block truncate text-slate-500 text-xs">{place.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
