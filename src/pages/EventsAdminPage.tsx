import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { toast } from 'sonner';
import { Loader2, Plus, Calendar, MapPin, X, Star, Users as UsersIcon, AlertCircle, Pencil, Ban } from 'lucide-react';

interface EventItem {
    id: number;
    communityId: number;
    title: string;
    description: string;
    startDate: string;
    endDate?: string | null;
    location?: string | null;
    posterUrl?: string | null;
    isCancelled: boolean;
    isDeleted: boolean;
    createdAt: string;
    community?: { id: number; name: string } | null;
}

interface CommunityLite { id: number; name: string; status: string; }
interface Participant {
    platformUserId: number;
    fullName: string;
    profileImageUrl?: string | null;
    status: string;
    checkedIn: boolean;
    createdAt: string;
}
interface FeedbackItem {
    id: number;
    platformUserId: number;
    fullName: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
}
interface FeedbackReport {
    averageRating: number;
    count: number;
    items: FeedbackItem[];
}

type StatusFilter = 'all' | 'active' | 'cancelled' | 'past';

export default function EventsAdminPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [communities, setCommunities] = useState<CommunityLite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [communityFilter, setCommunityFilter] = useState<number | ''>('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editing, setEditing] = useState<EventItem | null>(null);
    const [form, setForm] = useState({
        communityId: '' as number | '',
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        posterUrl: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [detail, setDetail] = useState<EventItem | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [feedback, setFeedback] = useState<FeedbackReport | null>(null);
    const [detailTab, setDetailTab] = useState<'participants' | 'feedback'>('participants');
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        loadEvents();
        api.get('/communities').then(r => setCommunities(r.data ?? [])).catch(() => {});
    }, []);

    const loadEvents = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/events');
            setEvents(Array.isArray(res.data) ? res.data : []);
        } catch {
            /* sessiz */
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const now = Date.now();
        return events.filter(ev => {
            if (communityFilter !== '' && ev.communityId !== communityFilter) return false;
            if (statusFilter === 'cancelled' && !ev.isCancelled) return false;
            if (statusFilter === 'active' && (ev.isCancelled || new Date(ev.startDate).getTime() < now)) return false;
            if (statusFilter === 'past' && new Date(ev.startDate).getTime() >= now) return false;
            return true;
        });
    }, [events, communityFilter, statusFilter]);

    const openCreate = () => {
        setEditing(null);
        setForm({ communityId: '', title: '', description: '', startDate: '', endDate: '', location: '', posterUrl: '' });
        setFormError(null);
        setIsFormOpen(true);
    };

    const openEdit = (ev: EventItem) => {
        setEditing(ev);
        setForm({
            communityId: ev.communityId,
            title: ev.title,
            description: ev.description ?? '',
            startDate: toLocalInputValue(ev.startDate),
            endDate: ev.endDate ? toLocalInputValue(ev.endDate) : '',
            location: ev.location ?? '',
            posterUrl: ev.posterUrl ?? '',
        });
        setFormError(null);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (form.communityId === '' || !form.title || !form.startDate) {
            setFormError('Topluluk, başlık ve başlangıç tarihi zorunludur.');
            return;
        }
        setIsSubmitting(true);
        const body = {
            communityId: Number(form.communityId),
            title: form.title,
            description: form.description,
            startDate: new Date(form.startDate).toISOString(),
            endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
            location: form.location || null,
            posterUrl: form.posterUrl || null,
        };
        try {
            if (editing) {
                await api.put(`/events/${editing.id}`, body);
                toast.success('Etkinlik güncellendi.');
            } else {
                await api.post('/events', body);
                toast.success('Etkinlik oluşturuldu.');
            }
            setIsFormOpen(false);
            loadEvents();
        } catch (err: any) {
            const msg = err.response?.data?.message ?? err.response?.data?.Message ?? 'İşlem başarısız.';
            setFormError(msg);
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async (ev: EventItem) => {
        if (!confirm(`"${ev.title}" etkinliğini iptal etmek istediğine emin misin? Tüm katılımcılara bildirim gönderilecek.`)) return;
        try {
            await api.put(`/events/${ev.id}/cancel`);
            toast.success('Etkinlik iptal edildi.');
            loadEvents();
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'İptal başarısız.');
        }
    };

    const openDetail = async (ev: EventItem) => {
        setDetail(ev);
        setDetailTab('participants');
        setParticipants([]);
        setFeedback(null);
        setDetailLoading(true);
        try {
            const [pRes, fRes] = await Promise.allSettled([
                api.get(`/events/${ev.id}/participants`),
                api.get(`/events/${ev.id}/feedback`),
            ]);
            if (pRes.status === 'fulfilled') setParticipants(pRes.value.data ?? []);
            if (fRes.status === 'fulfilled') setFeedback(fRes.value.data ?? null);
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Etkinlikler</h1>
                    <p className="text-sm text-gray-500 mt-1">Tüm topluluk etkinliklerini buradan yönet.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-[#E30613] hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-colors"
                >
                    <Plus size={18} /> Yeni Etkinlik
                </button>
            </div>

            <div className="bg-white rounded-[20px] p-5 shadow-sm flex flex-wrap items-center gap-3">
                <select
                    value={communityFilter}
                    onChange={(e) => setCommunityFilter(e.target.value === '' ? '' : Number(e.target.value))}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none"
                >
                    <option value="">Tüm Topluluklar</option>
                    {communities.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                {(['all', 'active', 'past', 'cancelled'] as StatusFilter[]).map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                            statusFilter === s
                                ? 'bg-[#E30613] text-white'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {s === 'all' ? 'Tümü' : s === 'active' ? 'Aktif' : s === 'past' ? 'Geçmiş' : 'İptal'}
                    </button>
                ))}
                <span className="ml-auto text-xs text-gray-400 font-semibold">{filtered.length} sonuç</span>
            </div>

            <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="py-16 flex items-center justify-center">
                        <Loader2 className="animate-spin h-10 w-10 text-[#E30613]" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 text-sm">Sonuç bulunamadı.</div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-6 py-3">Etkinlik</th>
                                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-6 py-3">Topluluk</th>
                                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-6 py-3">Tarih</th>
                                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-6 py-3">Konum</th>
                                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-6 py-3">Durum</th>
                                <th className="text-right text-xs font-semibold uppercase tracking-wider text-gray-500 px-6 py-3">Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(ev => {
                                const isPast = new Date(ev.startDate).getTime() < Date.now();
                                const statusInfo = ev.isCancelled
                                    ? { label: 'İptal', cls: 'bg-red-50 text-red-700 border-red-200' }
                                    : isPast
                                        ? { label: 'Geçmiş', cls: 'bg-gray-50 text-gray-600 border-gray-200' }
                                        : { label: 'Aktif', cls: 'bg-green-50 text-green-700 border-green-200' };
                                return (
                                    <tr key={ev.id} className="border-t border-gray-100 hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <button onClick={() => openDetail(ev)} className="text-left">
                                                <div className="font-semibold text-gray-900">{ev.title}</div>
                                                {ev.description && (
                                                    <div className="text-xs text-gray-500 line-clamp-1 mt-0.5 max-w-md">{ev.description}</div>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{ev.community?.name ?? '—'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                            <Calendar size={12} className="inline mr-1 text-gray-400" />
                                            {new Date(ev.startDate).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {ev.location ? <><MapPin size={12} className="inline mr-1 text-gray-400" />{ev.location}</> : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${statusInfo.cls}`}>
                                                {statusInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex gap-1">
                                                {!ev.isCancelled && !isPast && (
                                                    <>
                                                        <button
                                                            onClick={() => openEdit(ev)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700"
                                                        >
                                                            <Pencil size={12} /> Düzenle
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(ev)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-700"
                                                        >
                                                            <Ban size={12} /> İptal
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h2 className="font-bold text-gray-900">{editing ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}</h2>
                            <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (
                                <div className="bg-red-50 border-l-4 border-[#E30613] p-3 rounded-lg flex items-start gap-2 text-sm text-red-800">
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>{formError}</span>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Topluluk *</label>
                                <select
                                    value={form.communityId}
                                    onChange={(e) => setForm({ ...form, communityId: e.target.value === '' ? '' : Number(e.target.value) })}
                                    disabled={!!editing}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none disabled:bg-gray-50"
                                >
                                    <option value="">Seçiniz…</option>
                                    {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Başlık *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Açıklama</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Başlangıç *</label>
                                    <input
                                        type="datetime-local"
                                        value={form.startDate}
                                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Bitiş</label>
                                    <input
                                        type="datetime-local"
                                        value={form.endDate}
                                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Konum</label>
                                <input
                                    type="text"
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Poster URL</label>
                                <input
                                    type="text"
                                    value={form.posterUrl}
                                    onChange={(e) => setForm({ ...form, posterUrl: e.target.value })}
                                    placeholder="https://…"
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100">
                                    Vazgeç
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#E30613] text-white hover:bg-red-700 shadow-md disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting && <Loader2 className="animate-spin h-4 w-4" />}
                                    {editing ? 'Güncelle' : 'Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {detail && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-start justify-between flex-shrink-0">
                            <div className="min-w-0">
                                <h2 className="font-bold text-gray-900 truncate">{detail.title}</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {detail.community?.name} · {new Date(detail.startDate).toLocaleString('tr-TR')}
                                </p>
                            </div>
                            <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-700 flex-shrink-0 ml-3"><X size={18} /></button>
                        </div>
                        <div className="flex border-b border-gray-100 flex-shrink-0">
                            <button
                                onClick={() => setDetailTab('participants')}
                                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${detailTab === 'participants' ? 'text-[#E30613] border-b-2 border-[#E30613]' : 'text-gray-500'}`}
                            >
                                <UsersIcon size={14} /> Katılımcılar ({participants.length})
                            </button>
                            <button
                                onClick={() => setDetailTab('feedback')}
                                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${detailTab === 'feedback' ? 'text-[#E30613] border-b-2 border-[#E30613]' : 'text-gray-500'}`}
                            >
                                <Star size={14} /> Geri Bildirim ({feedback?.count ?? 0})
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {detailLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="animate-spin h-8 w-8 text-[#E30613]" />
                                </div>
                            ) : detailTab === 'participants' ? (
                                participants.length === 0 ? (
                                    <div className="text-center text-sm text-gray-400 py-12">Henüz katılımcı yok.</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {participants.map(p => (
                                            <li key={p.platformUserId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                                                <div className="h-9 w-9 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center text-xs font-bold text-gray-600">
                                                    {p.profileImageUrl ? <img src={p.profileImageUrl} alt="" className="w-full h-full object-cover" /> : p.fullName.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900 truncate">{p.fullName}</div>
                                                    <div className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('tr-TR')}</div>
                                                </div>
                                                {p.checkedIn && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded">
                                                        Geldi
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )
                            ) : (
                                feedback && feedback.count > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-4 bg-yellow-50/50 rounded-xl">
                                            <div className="text-4xl font-black text-yellow-600">{feedback.averageRating.toFixed(1)}</div>
                                            <div>
                                                <div className="flex gap-0.5 mb-1">
                                                    {[1, 2, 3, 4, 5].map(n => (
                                                        <Star key={n} size={16} className={n <= Math.round(feedback.averageRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                                                    ))}
                                                </div>
                                                <div className="text-xs text-gray-600 font-semibold">{feedback.count} kişi değerlendirdi</div>
                                            </div>
                                        </div>
                                        <ul className="space-y-3">
                                            {feedback.items.map(f => (
                                                <li key={f.id} className="border border-gray-100 rounded-xl p-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-semibold text-gray-900">{f.fullName}</span>
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map(n => (
                                                                <Star key={n} size={12} className={n <= f.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {f.comment && <p className="text-sm text-gray-600">{f.comment}</p>}
                                                    <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">{new Date(f.createdAt).toLocaleDateString('tr-TR')}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="text-center text-sm text-gray-400 py-12">Henüz geri bildirim yok.</div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function toLocalInputValue(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
