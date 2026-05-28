import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Send, Megaphone, UserPlus, Info } from 'lucide-react';
import api from '../api';
import { formatRelativeTime } from '../lib/auth';

interface NotificationItem {
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

interface Props {
    onClose: () => void;
}

function iconForType(type: string) {
    switch (type) {
        case 'GlobalAnnouncement': return <Megaphone size={16} className="text-[#E30613]" />;
        case 'CommunityApplication': return <UserPlus size={16} className="text-blue-600" />;
        case 'System': return <Info size={16} className="text-gray-600" />;
        default: return <Bell size={16} className="text-gray-500" />;
    }
}

function targetRouteForType(type: string): string | null {
    switch (type) {
        case 'CommunityApplication': return '/dashboard/communities';
        case 'GlobalAnnouncement': return '/dashboard/announcements';
        default: return null;
    }
}

export default function NotificationDropdown({ onClose }: Props) {
    const navigate = useNavigate();
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/notifications');
            setItems(Array.isArray(res.data) ? res.data : []);
            setError(null);
        } catch {
            setError('Bildirimler yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleClick = async (n: NotificationItem) => {
        if (!n.isRead) {
            try { await api.put(`/notifications/${n.id}/read`); } catch { /* sessiz */ }
        }
        const target = targetRouteForType(n.type);
        onClose();
        if (target) navigate(target);
    };

    const handleReadAll = async () => {
        try {
            await api.put('/notifications/read-all');
            setItems(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch { /* sessiz */ }
    };

    const handleClearAll = async () => {
        if (!confirm('Tüm bildirimleri silmek istediğinden emin misin?')) return;
        try {
            await api.delete('/notifications/clear-all');
            setItems([]);
        } catch { /* sessiz */ }
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Bildirimler</h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleReadAll}
                        title="Tümünü okundu işaretle"
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                    >
                        <Check size={16} />
                    </button>
                    <button
                        onClick={handleClearAll}
                        title="Temizle"
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {isLoading && (
                    <div className="py-10 text-center text-sm text-gray-400">Yükleniyor…</div>
                )}
                {!isLoading && error && (
                    <div className="py-10 text-center text-sm text-red-500">{error}</div>
                )}
                {!isLoading && !error && items.length === 0 && (
                    <div className="py-10 text-center text-sm text-gray-400">Bildirim yok.</div>
                )}
                {!isLoading && !error && items.map(n => (
                    <button
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className={`w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${!n.isRead ? 'bg-red-50/30' : ''}`}
                    >
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {iconForType(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={`text-sm ${!n.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'} truncate`}>
                                {n.title}
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.message}</div>
                            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                                {formatRelativeTime(n.createdAt)}
                            </div>
                        </div>
                        {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#E30613] mt-2 flex-shrink-0"></span>
                        )}
                    </button>
                ))}
            </div>

            <div className="border-t border-gray-100 flex">
                <button
                    onClick={() => { onClose(); navigate('/dashboard/notifications'); }}
                    className="flex-1 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 uppercase tracking-wider"
                >
                    Tümünü Gör
                </button>
                <div className="w-px bg-gray-100" />
                <button
                    onClick={() => { onClose(); navigate('/dashboard/notifications/send'); }}
                    className="flex-1 py-3 text-xs font-bold text-[#E30613] hover:bg-red-50 uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                    <Send size={12} /> Gönder
                </button>
            </div>
        </div>
    );
}
