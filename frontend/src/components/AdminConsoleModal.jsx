import React, { useState, useEffect } from 'react';
import {
  X,
  Crown,
  Shield,
  Users,
  UserCheck,
  UserX,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  Calendar,
  Building,
  Mail,
  Activity,
  Layers,
  Trees,
} from 'lucide-react';
import { authApi, treeApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminConsoleModal({ isOpen, onClose }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'system'

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authApi.getUsers();
      setUsers(data?.users || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to retrieve registered users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRoleToggle = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    setActionLoading(`role-${targetUser.id}`);
    setError('');
    setSuccess('');
    try {
      await authApi.updateUserRole(targetUser.id, newRole);
      setSuccess(`Updated role for ${targetUser.name} to ${newRole.toUpperCase()}.`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user role.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to delete user "${targetUser.name}" (${targetUser.email})?`)) {
      return;
    }
    setActionLoading(`delete-${targetUser.id}`);
    setError('');
    setSuccess('');
    try {
      await authApi.deleteUser(targetUser.id);
      setSuccess(`User "${targetUser.name}" removed successfully.`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportData = async () => {
    try {
      const history = await treeApi.getHistory();
      const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vanjeevan-tree-inventory-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Inventory dataset exported as JSON successfully.');
    } catch {
      setError('Failed to export inventory records.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1f15]/75 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-[#fdfcf9] rounded-3xl shadow-2xl border border-[rgba(20,46,31,0.12)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative bg-[#142e1f] text-white p-6 sm:p-7 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Administrative Governance Console
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-['Fraunces'] text-white">
            System Administration &amp; Access Control
          </h2>
          <p className="text-xs sm:text-sm text-white/80 mt-1">
            Logged in as <span className="font-bold text-amber-300">{currentUser?.name}</span> ({currentUser?.email})
          </p>

          {/* Sub Navigation */}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-white text-[#142e1f] shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Registered Accounts ({users.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('system')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'system'
                  ? 'bg-white text-[#142e1f] shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Platform Health &amp; Data</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        <div className="p-4 pb-0 shrink-0 space-y-2">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
              <button type="button" onClick={() => setSuccess('')} className="text-emerald-600 hover:text-emerald-800">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'users' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-[#142e1f]">Platform User Accounts</h3>
                  <p className="text-xs text-[#708477]">
                    Manage roles between Administrator (tree removal rights, user management) and Field Researcher.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadUsers}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg border border-[rgba(20,46,31,0.15)] bg-white text-xs font-semibold text-[#142e1f] hover:bg-[#f3efe6] flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {loading && users.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#708477]">Loading accounts...</div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[rgba(20,46,31,0.1)] bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#f3efe6] border-b border-[rgba(20,46,31,0.08)] text-[#142e1f] font-bold">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Organization</th>
                        <th className="py-3 px-4">Created / Active</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(20,46,31,0.06)]">
                      {users.map((u) => {
                        const isSelf = Number(u.id) === Number(currentUser?.id);
                        return (
                          <tr key={u.id} className="hover:bg-[#fdfcf9] transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-[#142e1f]">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                    u.role === 'admin'
                                      ? 'bg-amber-100 text-[#582f0e] border border-amber-300'
                                      : 'bg-emerald-100 text-[#142e1f] border border-emerald-300'
                                  }`}
                                >
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div>{u.name}</div>
                                  {isSelf && (
                                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                      You (Current)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-[#44594c] font-mono">{u.email}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                  u.role === 'admin'
                                    ? 'bg-amber-100 text-[#582f0e] border border-amber-300'
                                    : 'bg-emerald-100 text-[#142e1f] border border-emerald-200'
                                }`}
                              >
                                {u.role === 'admin' ? (
                                  <>
                                    <Crown className="w-2.5 h-2.5 text-amber-600" /> ADMIN
                                  </>
                                ) : (
                                  <>
                                    <Shield className="w-2.5 h-2.5 text-emerald-600" /> USER
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#708477]">{u.organization || '—'}</td>
                            <td className="py-3.5 px-4 text-[#708477]">
                              <div>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</div>
                              {u.last_login && (
                                <div className="text-[10px] text-emerald-700">
                                  Seen {new Date(u.last_login).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleRoleToggle(u)}
                                  disabled={actionLoading !== null || isSelf}
                                  title={isSelf ? 'Cannot change own role' : `Switch role to ${u.role === 'admin' ? 'User' : 'Admin'}`}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                                    isSelf
                                      ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200'
                                      : 'bg-white hover:bg-[#f3efe6] text-[#142e1f] border-[rgba(20,46,31,0.15)]'
                                  }`}
                                >
                                  {u.role === 'admin' ? 'Make User' : 'Make Admin'}
                                </button>
                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u)}
                                    disabled={actionLoading !== null}
                                    title="Delete account"
                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[rgba(20,46,31,0.08)]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#708477] uppercase tracking-wider mb-1">
                    <Database className="w-3.5 h-3.5 text-[#2d6a4f]" />
                    <span>Database Engine</span>
                  </div>
                  <div className="text-xl font-bold font-['Fraunces'] text-[#142e1f]">SQLite 3 &amp; Mongo</div>
                  <div className="text-[11px] text-[#708477] mt-0.5">Persistent hybrid storage schema active</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[rgba(20,46,31,0.08)]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#708477] uppercase tracking-wider mb-1">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>GIS Earth Observation</span>
                  </div>
                  <div className="text-xl font-bold font-['Fraunces'] text-[#142e1f]">Sentinel-2 &amp; Landsat-9</div>
                  <div className="text-[11px] text-[#708477] mt-0.5">NDVI &amp; LST radiometric analytics live</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[rgba(20,46,31,0.08)]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#708477] uppercase tracking-wider mb-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Tree Authority Law</span>
                  </div>
                  <div className="text-xl font-bold font-['Fraunces'] text-[#142e1f]">Act 1975 Mandate</div>
                  <div className="text-[11px] text-[#708477] mt-0.5">Automated conservation brief synthesis</div>
                </div>
              </div>

              {/* Data Export Card */}
              <div className="p-5 rounded-2xl bg-[#f3efe6] border border-[rgba(20,46,31,0.1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[#142e1f] flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#2d6a4f]" />
                    <span>Export Verified Field Inventory Records</span>
                  </h4>
                  <p className="text-xs text-[#708477] mt-0.5">
                    Download full tree metadata including GPS coordinates, allometric biomass, and carbon sequestration figures.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#142e1f] text-white hover:bg-[#1b3d2b] transition-all shrink-0 flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON Archive</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
