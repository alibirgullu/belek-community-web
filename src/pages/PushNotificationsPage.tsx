import { useEffect, useState } from 'react';
import api from '../api';
import { Send, Loader2, Bell, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';

interface CommunityLite { id: number; name: string; status: string; }
interface UserLite { id: number; firstName: string; lastName: string; status: string; }

type Target = 'all' | 'community' | 'users';

export default function PushNotificationsPage() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState<Target>('all');
    const [communityId, setCommunityId] = useState<number | ''>('');
    const [userIds, setUserIds] = useState<number[]>([]);
    const [userSearch, setUserSearch] = useState('');

    const [communities, setCommunities] = useState<CommunityLite[]>([]);
    const [users, setUsers] = useState<UserLite[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        api.get('/communities').then(r => setCommunities(r.data ?? [])).catch(() => {});
        api.get('/users').then(r => setUsers(r.data ?? [])).catch(() => {});
    }, []);

    const filteredUsers = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase())
    );

    const toggleUser = (id: number) => {
        setUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMsg(null);
        setErrorMsg(null);

        if (target === 'community' && !communityId) {
            setErrorMsg('Lütfen bir topluluk seç.');
            return;
        }
        if (target === 'users' && userIds.length === 0) {
            setErrorMsg('Lütfen en az bir öğrenci seç.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await api.post('/notifications/global', {
                title,
                message,
                targetCommunityId: target === 'community' ? Number(communityId) : null,
                targetUserIds: target === 'users' ? userIds : null,
            });
            setSuccessMsg(res.data?.message ?? res.data?.Message ?? 'Push gönderildi.');
            setTitle('');
            setMessage('');
            setUserIds([]);
            setTimeout(() => setSuccessMsg(null), 6000);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message ?? err.response?.data?.Message ?? 'Gönderim başarısız.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Push Bildirim Gönder</h1>
                <p className="text-sm text-gray-500 mt-1">Tüm öğrencilere, belirli bir topluluğa veya seçili kişilere anlık bildirim yolla.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2 bg-white rounded-[20px] p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {successMsg && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-lg flex items-start gap-2 text-sm text-green-800">
                                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                                <span>{successMsg}</span>
                            </div>
                        )}
                        {errorMsg && (
                            <div className="bg-red-50 border-l-4 border-[#E30613] p-3 rounded-lg flex items-start gap-2 text-sm text-red-800">
                                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Başlık</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Örn: Yarınki etkinlik hatırlatması"
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Mesaj</label>
                            <textarea
                                required
                                rows={4}
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Bildirimin gövdesi..."
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Hedef</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['all', 'community', 'users'] as Target[]).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setTarget(t)}
                                        className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                                            target === t
                                                ? 'border-[#E30613] bg-red-50 text-[#E30613]'
                                                : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {t === 'all' ? 'Tüm Öğrenciler' : t === 'community' ? 'Bir Topluluk' : 'Seçili Kişiler'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {target === 'community' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Topluluk Seç</label>
                                <select
                                    value={communityId}
                                    onChange={e => setCommunityId(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none"
                                >
                                    <option value="">Seçiniz…</option>
                                    {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}

                        {target === 'users' && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Öğrenciler</label>
                                    <span className="text-xs text-[#E30613] bg-red-50 px-2 py-0.5 rounded font-bold">{userIds.length} seçili</span>
                                </div>
                                <input
                                    type="text"
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    placeholder="İsim ile ara..."
                                    className="w-full mb-2 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none"
                                />
                                <div className="border border-gray-100 rounded-xl max-h-60 overflow-y-auto p-2 bg-gray-50/30">
                                    {filteredUsers.length === 0 ? (
                                        <div className="text-center text-xs text-gray-400 py-6">Öğrenci yok.</div>
                                    ) : filteredUsers.map(u => (
                                        <label key={u.id} className="flex items-center p-2 hover:bg-white rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={userIds.includes(u.id)}
                                                onChange={() => toggleUser(u.id)}
                                                className="w-4 h-4 accent-[#E30613] mr-3"
                                            />
                                            <span className="text-sm text-gray-800">{u.firstName} {u.lastName}</span>
                                            <span className="text-xs text-gray-400 ml-auto">#{u.id}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting || !title || !message}
                                className="flex items-center gap-2 bg-[#E30613] hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition-colors"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Send size={16} />}
                                Gönder
                            </button>
                        </div>
                    </form>
                </div>

                {/* Preview */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-[20px] p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Smartphone size={16} className="text-gray-400" />
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Önizleme</h3>
                        </div>
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-4">
                            <div className="bg-white rounded-xl p-3 shadow-sm">
                                <div className="flex items-start gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-[#E30613] flex items-center justify-center flex-shrink-0">
                                        <Bell size={14} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Belek Topluluk</span>
                                            <span className="text-[9px] text-gray-400">şimdi</span>
                                        </div>
                                        <div className="text-sm font-semibold text-gray-900 mt-0.5">
                                            {title || 'Başlık burada'}
                                        </div>
                                        <div className="text-xs text-gray-600 line-clamp-3 mt-0.5">
                                            {message || 'Mesaj içeriği burada görünecek.'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-800">
                            <strong className="block mb-1">Dikkat</strong>
                            Bildirim hem uygulama içine düşer hem de OS-level push olarak gönderilir.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
