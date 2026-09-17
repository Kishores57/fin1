 import React, { useState, useEffect } from 'react';
import { treeApi } from '../services/api';
import { MapPin, Trees, Hash, Ruler, Sparkles, Loader2 } from 'lucide-react';

export default function CalculatorForm({ onResult, onError }) {
  const [speciesList, setSpeciesList] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [gbh, setGbh] = useState('');
  const [height, setHeight] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

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

  // Geolocate user's current coordinates
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      onError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        onError("Unable to retrieve location. Please input coordinates manually.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
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
        <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
          <Trees className="w-4 h-4 text-emerald-500" />
          Tree Species
        </label>
        <select
          value={selectedSpecies}
          onChange={(e) => setSelectedSpecies(e.target.value)}
          className="w-full glass-input cursor-pointer"
        >
          {Array.isArray(speciesList) && speciesList.map((sp) => (
            <option key={sp.id} value={sp.name} className="bg-slate-900 text-slate-100">
              {sp.name}
            </option>
          ))}
          {(!Array.isArray(speciesList) || speciesList.length === 0) && (
            <option value="" className="bg-slate-900 text-slate-100">Loading species...</option>
          )}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <Hash className="w-4 h-4 text-emerald-500" />
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
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <Ruler className="w-4 h-4 text-emerald-500" />
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

      <div className="border-t border-slate-800/80 pt-6">
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-500" />
            GIS Geolocation Coordinates <span className="text-xs text-slate-500">(Optional)</span>
          </label>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={geoLoading}
            className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            {geoLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Locating...
              </>
            ) : (
              <>
                <MapPin className="w-3 h-3" />
                Use GPS Position
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            step="0.000001"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="Latitude (e.g. 12.9716)"
            className="w-full glass-input"
          />
          <input
            type="number"
            step="0.000001"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="Longitude (e.g. 77.5946)"
            className="w-full glass-input"
          />
        </div>
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
