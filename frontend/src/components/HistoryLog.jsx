import React, { useState, useEffect } from 'react';
import { treeApi } from '../services/api';
import { Database, Calendar, Eye, MapPin, Loader2, RefreshCw, Leaf, Sun, Trees, Trash2, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HistoryLog({ refreshTrigger, onSelectTree }) {
  const { isAdmin } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
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

  const handleDeleteTree = async (treeId) => {
    if (!window.confirm(`Are you sure you want to permanently delete Tree record #TR-${treeId.toString().padStart(4, '0')}?`)) {
      return;
    }
    setDeletingId(treeId);
    setError('');
    try {
      await treeApi.deleteHistory(treeId);
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete tree record:', err);
      setError(err.response?.data?.detail || 'Failed to delete record. Administrator authorization required.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  // Aggregate statistics for dashboard feel
  const safeHistory = Array.isArray(history) ? history : [];
  const totalTrees = safeHistory.length;
  const totalCO2 = safeHistory.reduce((acc, curr) => acc + (curr.co2 || 0), 0);
  const totalOxygen = safeHistory.reduce((acc, curr) => acc + (curr.oxygen || 0), 0);

  return (
    <div className="space-y-6">
      {/* Overview stats cards in refined warm sand & forest palette */}
      {totalTrees > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="nature-card p-5 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#708477]">Total Cataloged</span>
            <span className="text-2xl font-bold font-['Fraunces'] text-[#142e1f] mt-1">{totalTrees} trees</span>
            <span className="text-xs text-[#708477] mt-0.5">Recorded in inventory database</span>
          </div>
          <div className="nature-card p-5 flex flex-col justify-between border-[rgba(45,106,79,0.2)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f] flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" /> Cumulative CO₂ Stored
            </span>
            <span className="text-2xl font-bold font-['Fraunces'] text-[#2d6a4f] mt-1">{totalCO2.toFixed(1)} kg</span>
            <span className="text-xs text-[#708477] mt-0.5">Permanent biomass carbon vault</span>
          </div>
          <div className="nature-card p-5 flex flex-col justify-between border-[rgba(224,122,39,0.2)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e07a27] flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" /> Cumulative O₂ Released
            </span>
            <span className="text-2xl font-bold font-['Fraunces'] text-[#e07a27] mt-1">{totalOxygen.toFixed(1)} kg</span>
            <span className="text-xs text-[#708477] mt-0.5">Net photosynthetic output</span>
          </div>
        </div>
      )}

      {/* Control Header */}
      <div className="flex justify-between items-center bg-[#fdfcf9] p-4 rounded-2xl border border-[rgba(20,46,31,0.08)]">
        <h3 className="text-base font-bold text-[#142e1f] flex items-center gap-2">
          <Database className="w-4 h-4 text-[#2d6a4f]" />
          <span>Historical Inventory Database Records</span>
        </h3>
        <button
          onClick={loadHistory}
          disabled={loading}
          className="p-2 text-[#708477] hover:text-[#2d6a4f] hover:bg-[#f3efe6] rounded-lg transition-all"
          title="Refresh Database"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#708477]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2d6a4f] mb-2" />
          <p className="text-sm">Fetching verified records from server...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      ) : history.length === 0 ? (
        <div className="nature-card py-16 text-center border-dashed">
          <Trees className="w-12 h-12 text-[#a68a64] mx-auto mb-3" />
          <p className="text-[#142e1f] font-bold text-base">No trees cataloged yet</p>
          <p className="text-xs text-[#708477] mt-1 max-w-xs mx-auto">
            Use the Tree Registration &amp; Calculator form to log the first specimen with GPS coordinates.
          </p>
        </div>
      ) : (
        /* Editorial Table */
        <div className="nature-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f3efe6] border-b border-[rgba(20,46,31,0.08)] text-xs font-bold uppercase tracking-wider text-[#24523a]">
                  <th className="px-6 py-4">Record ID</th>
                  <th className="px-6 py-4">Species</th>
                  <th className="px-6 py-4">DBH &amp; Height</th>
                  <th className="px-6 py-4">Age</th>
                  <th className="px-6 py-4">CO₂ Stored</th>
                  <th className="px-6 py-4">Coordinates</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(20,46,31,0.06)] text-sm">
                {safeHistory.map((tree) => (
                  <tr key={tree.id} className="hover:bg-[#fbf9f4] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-[#708477]">
                      #TR-{tree.id.toString().padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#142e1f]">
                      {tree.species_name}
                    </td>
                    <td className="px-6 py-4 text-[#44594c]">
                      {tree.dbh.toFixed(1)} cm / {tree.height.toFixed(1)} m
                    </td>
                    <td className="px-6 py-4 text-[#44594c]">
                      {tree.age.toFixed(1)} yrs
                    </td>
                    <td className="px-6 py-4 text-[#2d6a4f] font-bold">
                      {tree.co2.toFixed(1)} kg
                    </td>
                    <td className="px-6 py-4 text-[#708477] text-xs">
                      {tree.latitude && tree.longitude ? (
                        <span className="flex items-center gap-1 font-mono text-[11px] text-[#24523a]">
                          <MapPin className="w-3 h-3 shrink-0 text-[#2d6a4f]" />
                          {tree.latitude.toFixed(4)}, {tree.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-[#a68a64] font-mono">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectTree(tree)}
                          className="px-3 py-1 text-xs font-bold text-[#2d6a4f] bg-[#d8f3dc] hover:bg-[#b7e4c7] rounded-full transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTree(tree.id)}
                            disabled={deletingId === tree.id}
                            title="Admin: Permanently delete tree record"
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors border border-transparent hover:border-red-200"
                          >
                            {deletingId === tree.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
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
