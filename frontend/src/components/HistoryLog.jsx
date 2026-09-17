import React, { useState, useEffect } from 'react';
import { treeApi } from '../services/api';
import { Database, Calendar, Eye, MapPin, Loader2, RefreshCw, Leaf, Sun } from 'lucide-react';

export default function HistoryLog({ refreshTrigger, onSelectTree }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await treeApi.getHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history:", err);
      setError("Could not retrieve tree inventory history. Check API status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  // Aggregate statistics for dashboard feel (with array safety guards)
  const safeHistory = Array.isArray(history) ? history : [];
  const totalTrees = safeHistory.length;
  const totalCO2 = safeHistory.reduce((acc, curr) => acc + (curr.co2 || 0), 0);
  const totalOxygen = safeHistory.reduce((acc, curr) => acc + (curr.oxygen || 0), 0);

  return (
    <div className="space-y-6">
      {/* Overview stats cards */}
      {totalTrees > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card bg-slate-900/30 p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Cataloged</span>
            <span className="text-2xl font-black text-slate-100 mt-1">{totalTrees} trees</span>
          </div>
          <div className="glass-card bg-slate-900/30 p-4 border-emerald-950/30 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
              <Leaf className="w-3 h-3" /> Cumulative CO₂ Stored
            </span>
            <span className="text-2xl font-black text-emerald-400 mt-1">{totalCO2.toFixed(1)} kg</span>
          </div>
          <div className="glass-card bg-slate-900/30 p-4 border-cyan-950/30 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-500 flex items-center gap-1">
              <Sun className="w-3 h-3" /> Cumulative O₂ Released
            </span>
            <span className="text-2xl font-black text-cyan-400 mt-1">{totalOxygen.toFixed(1)} kg</span>
          </div>
        </div>
      )}

      {/* Control Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-500" />
          Tree Inventory Database
        </h3>
        <button
          onClick={loadHistory}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-slate-800/40 rounded-lg transition-all"
          title="Refresh Database"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
          <p className="text-sm">Fetching records from server...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          {error}
        </div>
      ) : history.length === 0 ? (
        <div className="glass-card bg-slate-900/10 border-dashed border-slate-800 py-16 text-center">
          <Database className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No trees registered yet</p>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
            Use the calculator to compute metrics and log the first tree to the GIS database.
          </p>
        </div>
      ) : (
        /* Mobile-friendly list / desktop table */
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Species</th>
                  <th className="px-6 py-4">Size (DBH / H)</th>
                  <th className="px-6 py-4">Age</th>
                  <th className="px-6 py-4">CO₂ Stored</th>
                  <th className="px-6 py-4">GIS Location</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {safeHistory.map((tree) => (
                  <tr key={tree.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">
                      #TR-{tree.id.toString().padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      {tree.species_name}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {tree.dbh.toFixed(1)} cm / {tree.height.toFixed(1)} m
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {tree.age.toFixed(1)} yrs
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-bold">
                      {tree.co2.toFixed(1)} kg
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {tree.latitude && tree.longitude ? (
                        <span className="flex items-center gap-1 font-mono text-[11px] text-indigo-400">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {tree.latitude.toFixed(4)}, {tree.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onSelectTree(tree)}
                        className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-slate-800/40 rounded transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
