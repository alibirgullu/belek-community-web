import { useState, useEffect } from 'react';
import { Send, AlertCircle, Loader2, Clock, CheckCircle } from 'lucide-react';
import api from '../api';
import { toast } from 'sonner';

interface Community {
    id: number;
    name: string;
    status: string;
}

interface User {
    id: number;
    firstName: string;
    lastName: string;
    status: string;
}

export default function AnnouncementsAdminPage() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const [targetType, setTargetType] = useState<'all' | 'community' | 'users'>('all');
    const [communities, setCommunities] = useState<Community[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [targetCommunityId, setTargetCommunityId] = useState<number | ''>('');
    const [targetUserIds, setTargetUserIds] = useState<number[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');

    const [expiryDays, setExpiryDays] = useState(2);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [settingsMsg, setSettingsMsg] = useState('');

    useEffect(() => {
        api.get('/notifications/settings')
            .then(res => setExpiryDays(res.data.expiryDays ?? 2))
            .catch(() => {});

        api.get('/communities')
            .then(res => setCommunities(res.data))
            .catch(() => {});

        api.get('/users')
            .then(res => setUsers(res.data))
            .catch(() => {});
    }, []);

    const toggleUserSelection = (userId: number) => {
        setTargetUserIds(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const filteredUsers = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearchTerm.toLowerCase())
    );

    const handleSendAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (targetType === 'community' && !targetCommunityId) {
            toast.error('Lütfen bir topluluk seçin.');
            return;
        }

        if (targetType === 'users' && targetUserIds.length === 0) {
            toast.error('Lütfen en az bir öğrenci seçin.');
            return;
        }

        setIsSubmitting(true);
        setSuccessMsg('');

        try {
            await api.post('/notifications/global', { 
                title, 
                message: content,
                targetCommunityId: targetType === 'community' ? Number(targetCommunityId) : null,
                targetUserIds: targetType === 'users' ? targetUserIds : null
            });
            setSuccessMsg('Duyuru başarıyla gönderildi.');
            setTitle('');
            setContent('');
            setTargetUserIds([]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setSuccessMsg(''), 5000);
        }
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            const res = await api.put('/notifications/settings', { expiryDays });
            setSettingsMsg(res.data.message ?? 'Ayarlar kaydedildi.');
            setTimeout(() => setSettingsMsg(''), 4000);
        } catch {
            setSettingsMsg('Ayarlar kaydedilemedi.');
        } finally {
            setIsSavingSettings(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 font-inter tracking-tight">Genel Duyuru Sistemi</h2>
                <p className="text-gray-500 text-sm mt-1">Buradan göndereceğiniz duyurular, sisteme kayıtlı tüm öğrencilerin panosuna düşecektir.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">

                <div className="bg-red-50/80 p-5 border-b border-red-100 flex items-start gap-3 relative z-10">
                    <AlertCircle className="text-[#E02020] mt-0.5 animate-pulse" size={20} />
                    <div className="text-sm text-red-900 leading-relaxed">
                        <strong className="text-[#E02020] mr-1">Dikkat:</strong> Bu sayfadan gönderilen bildirimler direkt olarak uygulamanın ana ekranındaki <i className="text-red-950 font-medium">Duyurular</i> panosuna düşer ve tüm kullanıcılara "Push Notification" (Anlık Bildirim) olarak gider. Lütfen sadece önemli konular için kullanın.
                    </div>
                </div>

                <form onSubmit={handleSendAnnouncement} className="p-6 md:p-8 space-y-6 relative z-10">
                    {successMsg && (
                        <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-200 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
                            {successMsg}
                        </div>
                    )}

                    <div>
                        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                            Duyuru Başlığı
                        </label>
                        <input
                            id="title"
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Örn: 2025 Bahar Yarıyılı Topluluk Kayıtları Başladı!"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] bg-white text-gray-900 placeholder-gray-400 transition-all font-medium"
                        />
                    </div>

                    <div>
                        <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
                            Duyuru İçeriği
                        </label>
                        <textarea
                            id="content"
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={6}
                            placeholder="Öğrencilere iletmek istediğiniz mesajın detaylarını buraya girebilirsiniz..."
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] bg-white text-gray-900 placeholder-gray-400 transition-all font-medium resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Kime Gönderilecek?
                        </label>
                        <div className="flex flex-wrap gap-4 mb-4">
                            <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-xl transition-all ${targetType === 'all' ? 'border-[#E02020] bg-red-50 text-red-900' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                                <input 
                                    type="radio" 
                                    name="targetType" 
                                    value="all" 
                                    checked={targetType === 'all'} 
                                    onChange={() => setTargetType('all')}
                                    className="accent-[#E02020] w-4 h-4 cursor-pointer"
                                />
                                <span className="font-medium text-sm">Tüm Öğrenciler</span>
                            </label>
                            <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-xl transition-all ${targetType === 'community' ? 'border-[#E02020] bg-red-50 text-red-900' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                                <input 
                                    type="radio" 
                                    name="targetType" 
                                    value="community" 
                                    checked={targetType === 'community'} 
                                    onChange={() => setTargetType('community')}
                                    className="accent-[#E02020] w-4 h-4 cursor-pointer"
                                />
                                <span className="font-medium text-sm">Belirli Bir Topluluk</span>
                            </label>
                            <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-xl transition-all ${targetType === 'users' ? 'border-[#E02020] bg-red-50 text-red-900' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                                <input 
                                    type="radio" 
                                    name="targetType" 
                                    value="users" 
                                    checked={targetType === 'users'} 
                                    onChange={() => setTargetType('users')}
                                    className="accent-[#E02020] w-4 h-4 cursor-pointer"
                                />
                                <span className="font-medium text-sm">Seçili Öğrenciler</span>
                            </label>
                        </div>

                        {targetType === 'community' && (
                            <div className="mt-4 p-5 border border-red-100 bg-red-50/50 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                                <label htmlFor="communitySelect" className="block text-sm font-semibold text-red-900 mb-2">Topluluk Seçin</label>
                                <select 
                                    id="communitySelect"
                                    value={targetCommunityId}
                                    onChange={(e) => setTargetCommunityId(Number(e.target.value))}
                                    className="w-full rounded-xl border border-red-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] bg-white text-gray-900 transition-all font-medium"
                                >
                                    <option value="" disabled>Lütfen bir topluluk seçin...</option>
                                    {communities.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {targetType === 'users' && (
                            <div className="mt-4 p-5 border border-red-100 bg-red-50/50 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                                <label className="block text-sm font-semibold text-red-900 mb-3 flex items-center justify-between">
                                    <span>Öğrencileri Seçin</span>
                                    <span className="text-xs bg-[#E02020] text-white px-2 py-1 rounded-md">{targetUserIds.length} seçildi</span>
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="İsim veya soyisim ile ara..." 
                                    value={userSearchTerm}
                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                    className="w-full mb-3 rounded-xl border border-red-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] bg-white text-gray-900 text-sm transition-all"
                                />
                                <div className="h-48 overflow-y-auto border border-red-200 rounded-xl bg-white p-2 space-y-1 shadow-inner">
                                    {filteredUsers.length === 0 ? (
                                        <div className="text-sm text-gray-500 p-4 text-center">Öğrenci bulunamadı.</div>
                                    ) : (
                                        filteredUsers.map(u => (
                                            <label key={u.id} className="flex items-center p-2.5 hover:bg-red-50/50 rounded-lg cursor-pointer transition-colors group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={targetUserIds.includes(u.id)}
                                                    onChange={() => toggleUserSelection(u.id)}
                                                    className="w-4 h-4 text-[#E02020] rounded border-gray-300 focus:ring-[#E02020] accent-[#E02020] mr-3"
                                                />
                                                <span className="text-sm font-medium text-gray-800 group-hover:text-red-900">{u.firstName} {u.lastName}</span>
                                                <span className="text-xs text-gray-400 ml-auto font-mono">#{u.id}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting || !title || !content}
                            className="flex items-center space-x-2 bg-gradient-to-r from-[#E02020] to-red-700 hover:from-red-600 hover:to-red-800 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:shadow-red-500/20 disabled:opacity-50 disabled:grayscale disabled:hover:shadow-none transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    <Send size={18} />
                                    <span>Duyuruyu Yayınla</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Duyuru Görünürlük Süresi Ayarı */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-1">
                    <Clock size={18} className="text-[#E02020]" />
                    <h3 className="text-base font-bold text-gray-800">Duyuru Görünürlük Süresi</h3>
                </div>
                <p className="text-sm text-gray-500 mb-5">
                    Gönderilen global duyurular, uygulamada kaç gün boyunca görünsün? Süresi dolan duyurular otomatik olarak gizlenir (silinmez, sadece saklanır).
                </p>
                {settingsMsg && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
                        <CheckCircle size={16} /> {settingsMsg}
                    </div>
                )}
                <div className="flex items-center gap-4">
                    <input
                        type="number"
                        min={1}
                        max={30}
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(Math.min(30, Math.max(1, Number(e.target.value))))}
                        className="w-24 rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] text-gray-900 font-bold text-center text-lg"
                    />
                    <span className="text-gray-500 text-sm">gün  <span className="text-gray-400">(1–30 arası)</span></span>
                    <button
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        className="ml-auto flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                    >
                        {isSavingSettings ? <Loader2 size={16} className="animate-spin" /> : null}
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}
