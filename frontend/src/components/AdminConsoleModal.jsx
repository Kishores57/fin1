import React, { useState, useEffect } from 'react';
import {
  X,
  Crown,
  Shield,
  Users,
  UserCheck,
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
  Settings,
  LogOut,
  Lock,
  Key,
} from 'lucide-react';
import { authApi, treeApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminConsoleModal({ isOpen, onClose }) {
  const { user: currentUser, logout } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(isAdmin ? 'users' : 'account'); // 'account' | 'users' | 'system'

  const loadUsers = async () => {
    if (!isAdmin) return;
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
    if (isOpen && isAdmin) {
      loadUsers();
    }
  }, [isOpen, isAdmin]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#0d1f15]/75 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#fdfcf9] rounded-3xl shadow-2xl border border-[rgba(20,46,31,0.12)] overflow-hidden flex flex-col max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative bg-[#142e1f] text-white p-6 sm:p-7 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 p-2.5 rounded-full text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-all cursor-pointer shadow-sm border border-white/15"
            aria-label="Close modal"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              Settings &amp; System Administration
            </span>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Crown className="w-3 h-3 text-amber-400" />
                Administrator
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-['Fraunces'] text-white">
            System Administration &amp; Settings
          </h2>
          <p className="text-xs sm:text-sm text-white/80 mt-1">
            Logged in as <span className="font-bold text-amber-300">{currentUser?.name}</span> ({currentUser?.email})
          </p>

          {/* Sub Navigation */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'account'
                  ? 'bg-white text-[#142e1f] shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Account Profile</span>
            </button>
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
              <span>Registered Accounts {users.length > 0 ? `(${users.length})` : ''}</span>
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
          {/* TAB 1: ACCOUNT PROFILE */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="p-6 rounded-2xl bg-white border border-[rgba(20,46,31,0.08)] shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[rgba(20,46,31,0.08)]">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-md ${
                        isAdmin ? 'bg-amber-600' : 'bg-emerald-700'
                      }`}
                    >
                      {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-xl font-bold font-['Fraunces'] text-[#142e1f]">
                          {currentUser?.name || 'Researcher'}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isAdmin
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isAdmin ? 'ADMINISTRATOR' : 'FIELD RESEARCHER'}
                        </span>
                      </div>
                      <div className="text-xs text-[#708477] font-mono mt-0.5">
                        {currentUser?.email || 'user@vanjeevan.org'}
                      </div>
                      <div className="text-xs text-[#44594c] mt-1 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#2d6a4f]" />
                        <span>{currentUser?.organization || 'VanJeevan Ecological Network'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      logout();
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Log Out of System</span>
                  </button>
                </div>

                {/* Account Attributes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
                  <div className="p-3.5 rounded-xl bg-[#f8f6f0] border border-[rgba(20,46,31,0.06)]">
                    <div className="text-[10px] font-bold text-[#708477] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#2d6a4f]" />
                      Account Created
                    </div>
                    <div className="text-sm font-bold text-[#142e1f]">
                      {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : '10/13/2026'}
                    </div>
                    <div className="text-[11px] text-[#708477]">Verified member record</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#f8f6f0] border border-[rgba(20,46,31,0.06)]">
                    <div className="text-[10px] font-bold text-[#708477] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                      Session Security
                    </div>
                    <div className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active (JWT 256-bit)
                    </div>
                    <div className="text-[11px] text-[#708477]">Encrypted authorization token</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#f8f6f0] border border-[rgba(20,46,31,0.06)]">
                    <div className="text-[10px] font-bold text-[#708477] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      Privilege Level
                    </div>
                    <div className="text-sm font-bold text-[#142e1f]">
                      {isAdmin ? 'Full Administrative Access' : 'Field Research Access'}
                    </div>
                    <div className="text-[11px] text-[#708477]">
                      {isAdmin ? 'Tree Authority Act powers' : 'Field survey & AI modeling'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions Matrix */}
              <div className="p-5 rounded-2xl bg-white border border-[rgba(20,46,31,0.08)]">
                <h4 className="text-sm font-bold text-[#142e1f] mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#2d6a4f]" />
                  <span>Active System Entitlements</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#f3efe6]/60 border border-[rgba(20,46,31,0.06)] flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-[#142e1f]">AI Species &amp; Bark Age Analysis</div>
                      <div className="text-[11px] text-[#708477]">
                        Run EfficientNet-B4 neural classification and allometric calculations
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f3efe6]/60 border border-[rgba(20,46,31,0.06)] flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-[#142e1f]">GIS Spatial Earth Observation</div>
                      <div className="text-[11px] text-[#708477]">
                        View Sentinel-2 NDVI canopy index, heatmaps, and tree distribution
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f3efe6]/60 border border-[rgba(20,46,31,0.06)] flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-[#142e1f]">Field Tree Registration &amp; GPS Tagging</div>
                      <div className="text-[11px] text-[#708477]">
                        Register native trees, calculate carbon sequestration, and submit logs
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f3efe6]/60 border border-[rgba(20,46,31,0.06)] flex items-start gap-2.5">
                    {isAdmin ? (
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <Lock className="w-4 h-4 text-[#708477] shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-[#142e1f]">Tree Cutting Permit Adjudication</div>
                      <div className="text-[11px] text-[#708477]">
                        {isAdmin
                          ? 'Authorized to approve or reject removal applications'
                          : 'Citizen voting and permit submission rights'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTERED ACCOUNTS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-[#142e1f]">Platform User Accounts</h3>
                  <p className="text-xs text-[#708477]">
                    Manage roles between Administrator (tree removal rights, user management) and Field Researcher.
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={loadUsers}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg border border-[rgba(20,46,31,0.15)] bg-white text-xs font-semibold text-[#142e1f] hover:bg-[#f3efe6] flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                )}
              </div>

              {!isAdmin ? (
                <div className="py-12 px-6 text-center rounded-2xl bg-white border border-[rgba(20,46,31,0.08)]">
                  <Shield className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-[#142e1f]">Administrator Privileges Required</h3>
                  <p className="text-xs text-[#708477] max-w-md mx-auto mt-1">
                    User account management and role re-assignment are restricted to platform administrators. Contact your organization administrator for access.
                  </p>
                </div>
              ) : loading && users.length === 0 ? (
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
                                      : 'bg-white hover:bg-[#f3efe6] text-[#142e1f] border-[rgba(20,46,31,0.15)] cursor-pointer'
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
                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
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
          )}

          {/* TAB 3: PLATFORM HEALTH & SYSTEM */}
          {activeTab === 'system' && (
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
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#142e1f] text-white hover:bg-[#1b3d2b] transition-all shrink-0 flex items-center gap-2 shadow-sm cursor-pointer"
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
