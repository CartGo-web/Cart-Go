import React, { useState, useEffect } from 'react';
import { X, Bell, ShieldCheck, Calendar, Check, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SellerNotification } from '../types';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    setLoading(true);

    const q = query(collection(db, 'notifications'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: SellerNotification[] = [];
        snapshot.forEach((docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() } as SellerNotification;

          const recipient = data.recipientId;
          const isDirectToMe = recipient === currentUser.uid;
          const isBroadcastAll = recipient === 'all' || !recipient;
          const isBroadcastRole =
            (recipient === 'sellers' && userProfile?.role === 'seller') ||
            (recipient === 'buyers' && userProfile?.role === 'buyer');

          if (isDirectToMe || isBroadcastAll || isBroadcastRole) {
            list.push(data);
          }
        });

        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Error listening to user notifications:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [isOpen, currentUser, userProfile]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 px-6 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF5500] text-white flex items-center justify-center shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>My Notifications</span>
                <span className="px-2 py-0.5 bg-orange-500/30 text-orange-300 text-[10px] font-bold rounded-full border border-orange-400/40">
                  {notifications.length}
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Direct announcements & messages from Cart Go Administration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin"></div>
              <span>Loading your notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 bg-orange-100 text-[#FF5500] rounded-full flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Notifications Yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                You will receive private messages, system updates, and account status notifications here from the Super Admin.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isDirect = notif.recipientId === currentUser?.uid;
              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all space-y-2 relative ${
                    isDirect
                      ? 'bg-gradient-to-r from-orange-50/80 to-amber-50/50 border-orange-200 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF5500] shrink-0"></span>
                      <h4 className="text-xs font-extrabold text-slate-900">{notif.title}</h4>
                    </div>
                    {isDirect ? (
                      <span className="shrink-0 px-2.5 py-0.5 bg-[#FF5500] text-white text-[10px] font-bold rounded-full shadow-2xs">
                        🔒 Direct Message to You
                      </span>
                    ) : (
                      <span className="shrink-0 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                        📢 Broadcast
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-4">
                    {notif.message}
                  </p>

                  <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-400 pl-4">
                    <span className="font-semibold text-slate-500">
                      From: {notif.senderName || 'Cart Go Super Admin'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px]">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(notif.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            Close Notifications
          </button>
        </div>
      </div>
    </div>
  );
};
