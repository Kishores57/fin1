import React, { useState, useEffect } from 'react';
import { treeApi } from '../services/api';
import { MapPin, Trees, Hash, Ruler, Sparkles, Loader2, Search, Compass, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CalculatorForm({ onResult, onError }) {
  const [speciesList, setSpeciesList] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [gbh, setGbh] = useState('');
  const [height, setHeight] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [geoStatus, setGeoStatus] = useState(null);

  // Fetch species from database on mount
  useEffect(() => {
    async function loadSpecies() {
      try {
        const data = await treeApi.getSpecies();
        setSpeciesList(data);
        if (data.length > 0) {
          setSelectedSpecies(data[0].name);
        }
      } catch (err) {
        console.error("Failed to load species:", err);
        onError("Could not fetch species list from database. Make sure backend is running.");
      }
    }
    loadSpecies();
  }, [onError]);

  // Reverse geocode lat/lng to human-readable address
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'VanJeevan-TreeGIS/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        return data.display_name || '';
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    }
    return '';
  };

  // Geolocate user's current coordinates with accuracy detection
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus({ type: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }
    setGeoLoading(true);
    setGeoStatus({ type: 'info', message: 'Acquiring satellite GPS / network coordinates...' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const acc = Math.round(position.coords.accuracy || 10);
        setLatitude(lat);
        setLongitude(lng);
        setGeoLoading(false);

        const addr = await reverseGeocode(lat, lng);
        if (acc > 100) {
          setGeoStatus({
            type: 'warning',
            message: `Approximate network location (±${acc}m). On laptops and PCs, browsers detect your ISP gateway rather than satellite GPS. Search your city or use the study campus preset below if coordinates are offset.`,
            address: addr,
          });
        } else {
          setGeoStatus({
            type: 'success',
            message: `GPS Fix Locked (Precision: ±${acc}m)`,
            address: addr,
          });
        }
      },
      () => {
        // Fallback to standard network position
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            const acc = Math.round(position.coords.accuracy || 250);
            setLatitude(lat);
            setLongitude(lng);
            setGeoLoading(false);

            const addr = await reverseGeocode(lat, lng);
            setGeoStatus({
              type: 'warning',
              message: `Network approximate location (±${acc}m). On desktop/WiFi, coordinates represent your telecom hub. Use search below to pinpoint your exact campus or street.`,
              address: addr,
            });
          },
          (err2) => {
            console.error('Geolocation error:', err2);
            setGeoStatus({
              type: 'error',
              message: 'Unable to retrieve location. Please search your landmark/city or enter coordinates manually.',
            });
            setGeoLoading(false);
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search any city, campus, or landmark via OpenStreetMap geocoder
  const handleSearchLocation = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setGeoStatus({ type: 'info', message: `Searching geographic database for "${searchQuery.trim()}"...` });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&limit=1`,
        { headers: { 'User-Agent': 'VanJeevan-TreeGIS/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const top = data[0];
          const lat = parseFloat(top.lat).toFixed(6);
          const lng = parseFloat(top.lon).toFixed(6);
          setLatitude(lat);
          setLongitude(lng);
          setGeoStatus({
            type: 'success',
            message: `Pinned: ${top.display_name.slice(0, 65)}...`,
            address: top.display_name,
          });
        } else {
          setGeoStatus({
            type: 'error',
            message: 'Location not found. Try searching with city name (e.g. "Nashik", "K.K. Wagh College", "Panchavati").',
          });
        }
      }
    } catch (err) {
      setGeoStatus({ type: 'error', message: 'Location search failed. Check your network connection.' });
    } finally {
      setIsSearching(false);
    }
  };

  // Preset for field study area (Nashik Campus)
  const handleSetCampusPreset = () => {
    setLatitude('20.013100');
    setLongitude('73.821316');
    setGeoStatus({
      type: 'success',
      message: 'Applied Field Study Preset: K.K. Wagh Campus, Nashik (20.013100, 73.821316)',
      address: 'K.K. Wagh Institute of Engineering Education & Research, Nashik, Maharashtra',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSpecies || !gbh || !height) {
      onError("Please fill in all required fields (Species, GBH, and Height).");
      return;
    }

    setLoading(true);
    try {
      const data = await treeApi.calculateTree(
        selectedSpecies,
        gbh,
        height,
        latitude || null,
        longitude || null
      );
      onResult(data);
    } catch (err) {
      console.error("Calculation failed:", err);
      const errMsg = err.response?.data?.detail || "An unexpected error occurred during calculation. Verify API connectivity.";
      onError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
          <Trees className="w-4 h-4 text-emerald-400" />
          Tree Species
        </label>
        <select
          value={selectedSpecies}
          onChange={(e) => setSelectedSpecies(e.target.value)}
          className="w-full glass-input cursor-pointer"
        >
          {Array.isArray(speciesList) && speciesList.map((sp) => (
            <option key={sp.id} value={sp.name} className="bg-emerald-950 text-emerald-200">
              {sp.name}
            </option>
          ))}
          {(!Array.isArray(speciesList) || speciesList.length === 0) && (
            <option value="" className="bg-emerald-950 text-emerald-200">Loading species...</option>
          )}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
            <Hash className="w-4 h-4 text-emerald-400" />
            Girth at Breast Height (GBH in cm)
          </label>
          <input
            type="number"
            step="0.01"
            value={gbh}
            onChange={(e) => setGbh(e.target.value)}
            placeholder="e.g. 94"
            className="w-full glass-input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
            <Ruler className="w-4 h-4 text-emerald-400" />
            Tree Height (H in meters)
          </label>
          <input
            type="number"
            step="0.01"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="e.g. 12"
            className="w-full glass-input"
            required
          />
        </div>
      </div>

      <div className="border-t border-emerald-900/60 pt-6 space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <label className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            GIS Geolocation Coordinates <span className="text-xs text-emerald-500/70">(Optional)</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSetCampusPreset}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 flex items-center gap-1 transition-all"
              title="Set coordinates to Nashik Field Study Campus (20.013100, 73.821316)"
            >
              <Compass className="w-3 h-3 text-emerald-400" />
              Nashik Campus
            </button>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={geoLoading}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              {geoLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Locating...
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  Use Live GPS
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search location bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation(e)}
              placeholder="Search landmark, campus or city (e.g. Nashik, KK Wagh, Pune)..."
              className="w-full glass-input pl-9 text-xs py-2"
            />
          </div>
          <button
            type="button"
            onClick={handleSearchLocation}
            disabled={isSearching || !searchQuery.trim()}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1 transition-all disabled:opacity-40"
          >
            {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* GPS / Geolocation Status Feedback Banner */}
        {geoStatus && (
          <div
            className={`p-3 rounded-xl border text-xs transition-all ${
              geoStatus.type === 'warning'
                ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                : geoStatus.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : geoStatus.type === 'error'
                ? 'bg-red-950/40 border-red-600/50 text-red-200'
                : 'bg-slate-900/40 border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-start gap-2">
              {geoStatus.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              {geoStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {geoStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
              <div className="space-y-1 flex-1">
                <p className="font-semibold leading-relaxed">{geoStatus.message}</p>
                {geoStatus.address && (
                  <p className="text-[11px] opacity-80 break-words flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{geoStatus.address}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="block text-[11px] text-emerald-400/80 mb-1 font-mono">Latitude</span>
            <input
              type="number"
              step="0.000001"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 20.013100"
              className="w-full glass-input font-mono text-sm"
            />
          </div>
          <div>
            <span className="block text-[11px] text-emerald-400/80 mb-1 font-mono">Longitude</span>
            <input
              type="number"
              step="0.000001"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. 73.821316"
              className="w-full glass-input font-mono text-sm"
            />
          </div>
        </div>
        <p className="text-[11px] text-emerald-500/60 italic">
          💡 On PC/WiFi without GPS chips, browsers query ISP network IP. Use the search bar above or study area preset to pinpoint exact coordinates.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.98] text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/20 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
            Analyzing & Running RAG Pipeline...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 text-slate-950" />
            Calculate Climate Impact
          </>
        )}
      </button>
    </form>
  );
}
