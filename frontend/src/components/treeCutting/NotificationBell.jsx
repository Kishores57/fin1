import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, ShieldAlert, FileText, Vote, Award, X } from 'lucide-react';
import { treeCuttingApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function NotificationBell({ onSelectApplication }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await treeCuttingApi.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // Quiet fail if network error
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await treeCuttingApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'DECISION_ISSUED':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'VOTING_OPEN':
        return <Vote className="w-4 h-4 text-amber-600" />;
      case 'INVESTIGATION_ALERT':
        return <ShieldAlert className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-[#2d6a4f]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2 rounded-full text-[#708477] hover:text-[#142e1f] hover:bg-[#f3efe6] transition-all"
        title="Civic Notifications"
        aria-label="Civic Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#fdfcf9] rounded-2xl shadow-xl border border-[rgba(20,46,31,0.12)] overflow-hidden z-50 animate-fadeIn">
          <div className="p-3.5 bg-[#142e1f] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#95d5b2]" />
              <span className="font-bold text-xs uppercase tracking-wider">Permit &amp; Voting Alerts</span>
            </div>
            {unreadCount > 0 && (
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[rgba(20,46,31,0.06)]">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#708477]">
                No permit or voting notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => {
                    if (onSelectApplication && n.applicationId) {
                      onSelectApplication(n.applicationId);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3 text-left transition-colors cursor-pointer hover:bg-[#f3efe6] flex items-start gap-3 ${
                    n.isRead ? 'opacity-70 bg-white' : 'bg-emerald-50/40'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white shadow-xs shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-[#142e1f] truncate">{n.title}</h4>
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkRead(n._id, e)}
                          title="Mark read"
                          className="p-1 text-[#708477] hover:text-[#2d6a4f]"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#44594c] line-clamp-2 mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-[#708477]">
                      <span className="font-mono">{n.applicationId}</span>
                      <span>&middot;</span>
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
