import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { Loader2, Bell, Check, Trash2, Megaphone, UserPlus, Info } from 'lucide-react';
import { formatRelativeTime } from '../lib/auth';

interface NotificationItem {
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

type ReadFilter = 'all' | 'unread' | 'read';

function iconFor(type: string) {
    switch (type) {
        case 'GlobalAnnouncement': return <Megaphone size={16} className="text-[#E30613]" />;
        case 'CommunityApplication': return <UserPlus size={16} className="text-blue-600" />;
        case 'System': return <Info size={16} className="text-gray-600" />;
        default: return <Bell size={16} className="text-gray-500" />;
    }
}

export default function NotificationsListPage() {
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [readFilter, setReadFilter] = useState<ReadFilter>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/notifications');
            setItems(Array.isArray(res.data) ? res.data : []);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const types = useMemo(() => {
        return Array.from(new Set(items.map(i => i.type)));
    }, [items]);

    const filtered = useMemo(() => {
        return items.filter(n => {
            if (readFilter === 'unread' && n.isRead) return false;
            if (readFilter === 'read' && !n.isRead) return false;
            if (typeFilter !== 'all' && n.type !== typeFilter) return false;
            return true;
        });
    }, [items, readFilter, typeFilter]);

    const handleReadAll = async () => {
        try {
            await api.put('/notifications/read-all');
            setItems(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch { /* sessiz */ }
    };

    const handleClearAll = async () => {
        if (!confirm('Tüm bildirimleri silmek istediğine emin misin?')) return;
        try {
            await api.delete('/notifications/clear-all');
            setItems([]);
        } catch { /* sessiz */ }
    };

    const handleMarkRead = async (id: number) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch { /* sessiz */ }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/notifications/${id}`);
            setItems(prev => prev.filter(n => n.id !== id));
        } catch { /* sessiz */ }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tüm Bildirimler</h1>
                    <p className="text-sm text-gray-500 mt-1">Sana gelen tüm bildirimleri buradan filtreleyebilir ve yönetebilirsin.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleReadAll} className="inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200">
                        <Check size={14} /> Tümünü okundu işaretle
                    </button>
                    <button onClick={handleClearAll} className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-semibold text-red-700 border border-red-100">
                        <Trash2 size={14} /> Temizle
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[20px] p-4 shadow-sm flex flex-wrap items-center gap-3">
                {(['all', 'unread', 'read'] as ReadFilter[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setReadFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                            readFilter === f ? 'bg-[#E30613] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {f === 'all' ? 'Tümü' : f === 'unread' ? 'Okunmamış' : 'Okunmuş'}
                    </button>
                ))}
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#E02020]/50 outline-none"
                >
                    <option value="all">Tüm Tipler</option>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="ml-auto text-xs text-gray-400 font-semibold">{filtered.length} sonuç</span>
            </div>

            <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="py-12 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#E30613]" /></div>
                ) : filtered.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400">Bildirim yok.</div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {filtered.map(n => (
                            <li key={n.id} className={`flex items-start gap-3 px-6 py-4 group ${!n.isRead ? 'bg-red-50/20' : ''}`}>
                                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {iconFor(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm ${!n.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                        {n.title}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-0.5">{n.message}</div>
                                    <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                                        {formatRelativeTime(n.createdAt)} · {n.type}
                                    </div>
                                </div>
                                {!n.isRead && (
                                    <button onClick={() => handleMarkRead(n.id)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100" title="Okundu işaretle">
                                        <Check size={14} />
                                    </button>
                                )}
                                <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100" title="Sil">
                                    <Trash2 size={14} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
